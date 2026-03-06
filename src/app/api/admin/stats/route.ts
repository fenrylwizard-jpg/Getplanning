import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/stats
 * Global KPI aggregation across ALL projects for the admin dashboard.
 */
export async function GET() {
    try {
        const [projects, users, weeklyPlans, tasks] = await Promise.all([
            prisma.project.findMany({
                include: {
                    tasks: { select: { quantity: true, completedQuantity: true, minutesPerUnit: true } },
                    weeklyPlans: { select: { targetReached: true, isClosed: true } },
                    projectManager: { select: { name: true } },
                }
            }),
            prisma.user.findMany({ select: { role: true, level: true } }),
            prisma.weeklyPlan.aggregate({ _count: { id: true } }),
            prisma.task.aggregate({ _count: { id: true } }),
        ]);

        const HOURLY_RATE = 43.35;

        let totalBudgetHours = 0;
        let totalEarnedHours = 0;
        const projectStats = projects.map(p => {
            const budget = p.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
            const earned = p.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
            totalBudgetHours += budget;
            totalEarnedHours += earned;
            const closed = p.weeklyPlans.filter(w => w.isClosed).length;
            const hit = p.weeklyPlans.filter(w => w.targetReached).length;
            return {
                id: p.id,
                name: p.name,
                pm: p.projectManager?.name || '—',
                budgetHours: Math.round(budget),
                earnedHours: Math.round(earned),
                pct: budget > 0 ? Math.round((earned / budget) * 100) : 0,
                weeksClosed: closed,
                weeksHit: hit,
            };
        });

        const pmCount = users.filter(u => u.role === 'PM').length;
        const smCount = users.filter(u => u.role === 'SM').length;
        const closedPlans = await prisma.weeklyPlan.count({ where: { isClosed: true } });
        const hitPlans = await prisma.weeklyPlan.count({ where: { targetReached: true } });

        return NextResponse.json({
            totalProjects: projects.length,
            totalPMs: pmCount,
            totalSMs: smCount,
            totalBudgetHours: Math.round(totalBudgetHours),
            totalEarnedHours: Math.round(totalEarnedHours),
            totalBudgetEur: Math.round(totalBudgetHours * HOURLY_RATE),
            totalEarnedEur: Math.round(totalEarnedHours * HOURLY_RATE),
            globalPct: totalBudgetHours > 0 ? Math.round((totalEarnedHours / totalBudgetHours) * 100) : 0,
            totalWeeklyPlans: weeklyPlans._count.id,
            closedPlans,
            hitPlans,
            hitRate: closedPlans > 0 ? Math.round((hitPlans / closedPlans) * 100) : 0,
            totalTasks: tasks._count.id,
            projects: projectStats,
        });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
