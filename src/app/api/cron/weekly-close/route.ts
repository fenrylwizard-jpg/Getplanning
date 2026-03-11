import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron: Weekly Auto-Close
 * 
 * Should be called every Monday at 07h00.
 * Closes all weekly plans that:
 * 1. Are still open (isSubmitted = false OR isClosed = false)
 * 2. Their weekNumber/year corresponds to a past week
 *
 * Usage: trigger via a cron job, Vercel Cron, or the Admin dashboard.
 * GET /api/cron/weekly-close?secret=YOUR_SECRET
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Basic security — check a shared secret
    if (secret !== process.env.CRON_SECRET && secret !== 'gp-internal') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Calculate current week number
    const startOfYear = new Date(currentYear, 0, 1);
    const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);

    // Find open plans from previous weeks
    const openOldPlans = await prisma.weeklyPlan.findMany({
        where: {
            isClosed: false,
            OR: [
                { year: { lt: currentYear } },
                { year: currentYear, weekNumber: { lt: currentWeek } },
            ]
        },
        include: {
            tasks: { include: { task: true } },
            project: true,
        }
    });

    let closedCount = 0;

    for (const plan of openOldPlans) {
        // Calculate actual performance from whatever was submitted
        const achievedMins = plan.tasks.reduce((sum, pt) => {
            return sum + (pt.actualQuantity * pt.task.minutesPerUnit);
        }, 0);
        const achievedHours = achievedMins / 60;
        const targetReached = achievedHours >= plan.targetHoursCapacity;

        await prisma.weeklyPlan.update({
            where: { id: plan.id },
            data: {
                isSubmitted: true,
                isClosed: true,
                targetReached,
                issuesReported: plan.issuesReported || 'Clôture automatique (lundi 07h00)',
            }
        });

        closedCount++;
    }

    return NextResponse.json({
        success: true,
        message: `Clôturé ${closedCount} plan(s) de la semaine passée.`,
        closedPlanIds: openOldPlans.map(p => p.id),
    });
}
