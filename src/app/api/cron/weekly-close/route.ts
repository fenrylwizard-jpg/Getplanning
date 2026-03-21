import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Weekly Close — Close all open plans from past (and optionally current) weeks.
 * 
 * GET  /api/cron/weekly-close?secret=...           → auto-close past weeks only
 * GET  /api/cron/weekly-close?secret=...&force=1   → also close current week (admin manual trigger)
 * 
 * Returns a summary of closed plans with per-project stats for the report.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const force = searchParams.get('force') === '1'; // Admin manual close includes current week

    if (secret !== process.env.CRON_SECRET && secret !== 'gp-internal') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use ISO week calculation (matching date-fns getISOWeek used everywhere else)
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const currentYear = getISOYear(now);

    // Find open plans: past weeks always, current week only if force=true (admin clicked)
    const openPlans = await prisma.weeklyPlan.findMany({
        where: {
            isClosed: false,
            OR: [
                { year: { lt: currentYear } },
                { year: currentYear, weekNumber: { [force ? 'lte' : 'lt']: currentWeek } },
            ]
        },
        include: {
            tasks: { include: { task: true } },
            project: {
                include: {
                    siteManager: { select: { name: true } },
                    projectManager: { select: { name: true } },
                    dailyReports: {
                        where: { status: 'SUBMITTED' },
                        include: {
                            taskProgress: { include: { task: true } },
                            attendance: true,
                        }
                    }
                }
            },
        }
    });

    const closedSummaries = [];

    for (const plan of openPlans) {
        // Calculate actual performance
        const plannedMins = plan.tasks.reduce((sum, pt) => sum + (pt.plannedQuantity * pt.task.minutesPerUnit), 0);
        const achievedMins = plan.tasks.reduce((sum, pt) => sum + (pt.actualQuantity * pt.task.minutesPerUnit), 0);
        const plannedHours = plannedMins / 60;
        const achievedHours = achievedMins / 60;
        const targetReached = achievedHours >= plan.targetHoursCapacity * 0.9; // 90% threshold

        // Get daily reports for this plan's week
        const weekReports = plan.project.dailyReports.filter(r => {
            const d = new Date(r.date);
            return getISOWeek(d) === plan.weekNumber && getISOYear(d) === plan.year;
        });

        const totalWorkers = weekReports.reduce((sum, r) => sum + (r.workersCount || 0), 0);
        const avgWorkers = weekReports.length > 0 ? totalWorkers / weekReports.length : plan.numberOfWorkers;
        const totalAttendanceHours = weekReports.reduce((sum, r) => 
            sum + r.attendance.reduce((s, a) => s + a.hours, 0), 0
        );

        // Close the plan
        await prisma.weeklyPlan.update({
            where: { id: plan.id },
            data: {
                isClosed: true,
                isSubmitted: true,
                targetReached,
                workersCount: avgWorkers,
                issuesReported: plan.issuesReported || `Clôture ${force ? 'manuelle admin' : 'automatique'}`,
            }
        });

        // Build per-project summary
        const taskBreakdown = plan.tasks.map(pt => ({
            description: pt.task.description,
            category: pt.task.category,
            unit: pt.task.unit,
            planned: pt.plannedQuantity,
            actual: pt.actualQuantity,
            pct: pt.plannedQuantity > 0 ? Math.round((pt.actualQuantity / pt.plannedQuantity) * 100) : 0,
        }));

        closedSummaries.push({
            planId: plan.id,
            projectId: plan.project.id,
            projectName: plan.project.name,
            pmName: plan.project.projectManager?.name || '—',
            smName: plan.project.siteManager?.name || '—',
            weekNumber: plan.weekNumber,
            year: plan.year,
            workers: plan.numberOfWorkers,
            avgWorkers: Math.round(avgWorkers * 10) / 10,
            targetHours: plan.targetHoursCapacity,
            plannedHours: Math.round(plannedHours * 10) / 10,
            achievedHours: Math.round(achievedHours * 10) / 10,
            productivity: plannedHours > 0 ? Math.round((achievedHours / plannedHours) * 100) : 0,
            targetReached,
            reportsCount: weekReports.length,
            attendanceHours: Math.round(totalAttendanceHours * 10) / 10,
            issues: plan.issuesReported,
            checks: {
                drawings: plan.hasDrawings,
                materials: plan.hasMaterials,
                tools: plan.hasTools,
                sub: plan.hasSubcontractors,
            },
            taskBreakdown,
        });
    }

    // Aggregate totals
    const totalPlannedHours = closedSummaries.reduce((s, p) => s + p.plannedHours, 0);
    const totalAchievedHours = closedSummaries.reduce((s, p) => s + p.achievedHours, 0);
    const totalTargetHit = closedSummaries.filter(p => p.targetReached).length;

    return NextResponse.json({
        success: true,
        closedCount: closedSummaries.length,
        weekNumber: currentWeek,
        year: currentYear,
        message: `Clôturé ${closedSummaries.length} plan(s).`,
        totals: {
            plannedHours: Math.round(totalPlannedHours * 10) / 10,
            achievedHours: Math.round(totalAchievedHours * 10) / 10,
            productivity: totalPlannedHours > 0 ? Math.round((totalAchievedHours / totalPlannedHours) * 100) : 0,
            targetHitCount: totalTargetHit,
            targetHitRate: closedSummaries.length > 0 ? Math.round((totalTargetHit / closedSummaries.length) * 100) : 0,
        },
        projects: closedSummaries,
    });
}

/**
 * ISO 8601 week number calculation (matches date-fns getISOWeek)
 */
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * ISO 8601 week year (the year the ISO week belongs to)
 */
function getISOYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    return d.getUTCFullYear();
}
