import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HOURLY_RATE_EUR } from '@/lib/xp-engine';

/**
 * GET /api/project/[id]/analytics
 * Returns profitability data, task progress, and timeline chart data for PM dashboard.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: true,
                weeklyPlans: {
                    include: { tasks: true },
                    orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
                },
            }
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // ── Totals ──────────────────────────────────────────────────────────
        const totalBudgetHours = project.tasks.reduce((sum, t) => {
            return sum + (t.quantity * t.minutesPerUnit) / 60;
        }, 0);

        const totalEarnedHours = project.tasks.reduce((sum, t) => {
            return sum + (t.completedQuantity * t.minutesPerUnit) / 60;
        }, 0);

        const totalBudgetEur = totalBudgetHours * HOURLY_RATE_EUR;
        const totalSpentEur = totalEarnedHours * HOURLY_RATE_EUR;
        const profitabilityPct = totalBudgetHours > 0
            ? Math.round((totalEarnedHours / totalBudgetHours) * 100)
            : 0;

        // ── Weekly Chart Data (planned vs actual hours) ─────────────────────
        const weeklyData = project.weeklyPlans.map(plan => {
            const plannedHours = plan.targetHoursCapacity;
            const actualHours = plan.tasks.reduce((sum, pt) => {
                const taskInfo = project.tasks.find(t => t.id === pt.taskId);
                return sum + ((pt.actualQuantity * (taskInfo?.minutesPerUnit || 0)) / 60);
            }, 0);

            return {
                label: `S${plan.weekNumber}`,
                planned: Math.round(plannedHours * 10) / 10,
                actual: Math.round(actualHours * 10) / 10,
                targetReached: plan.targetReached,
            };
        });

        // ── Task categories breakdown ──────────────────────────────────────
        const categories: Record<string, { budgetHours: number, earnedHours: number }> = {};
        for (const task of project.tasks) {
            if (!categories[task.category]) {
                categories[task.category] = { budgetHours: 0, earnedHours: 0 };
            }
            categories[task.category].budgetHours += (task.quantity * task.minutesPerUnit) / 60;
            categories[task.category].earnedHours += (task.completedQuantity * task.minutesPerUnit) / 60;
        }

        return NextResponse.json({
            totalBudgetHours: Math.round(totalBudgetHours * 10) / 10,
            totalEarnedHours: Math.round(totalEarnedHours * 10) / 10,
            totalBudgetEur: Math.round(totalBudgetEur),
            totalSpentEur: Math.round(totalSpentEur),
            profitabilityPct,
            hourlyRate: HOURLY_RATE_EUR,
            weeklyData,
            categories: Object.entries(categories).map(([name, data]) => ({
                name,
                budgetHours: Math.round(data.budgetHours * 10) / 10,
                earnedHours: Math.round(data.earnedHours * 10) / 10,
            })).sort((a, b) => b.budgetHours - a.budgetHours),
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
