import { prisma } from './prisma';

/**
 * Calculates how many consecutive days a Site Manager has submitted reports.
 */
export async function getConsecutiveDaysReported(siteManagerId: string): Promise<number> {
    const reports = await prisma.dailyReport.findMany({
        where: { siteManagerId },
        orderBy: { date: 'desc' },
        select: { date: true },
        take: 30 // Check up to last 30 reports
    });

    if (reports.length === 0) return 0;

    let streak = 0;
    const lastDate = new Date();
    lastDate.setHours(0, 0, 0, 0);

    // Normalize input date (could be today or yesterday)
    const firstReportDate = new Date(reports[0].date);
    firstReportDate.setHours(0, 0, 0, 0);

    // If no report today or yesterday, streak is broken
    const diffTime = Math.abs(lastDate.getTime() - firstReportDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return 0;

    streak = 1;
    let currentDate = firstReportDate;

    for (let i = 1; i < reports.length; i++) {
        const prevDate = new Date(reports[i].date);
        prevDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(currentDate.getDate() - 1);
        
        if (prevDate.getTime() === expectedDate.getTime()) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculates how many consecutive weeks a project has reached its target capacity.
 */
export async function getConsecutiveWeeksTargetReached(projectId: string): Promise<number> {
    const plans = await prisma.weeklyPlan.findMany({
        where: { 
            projectId,
            isClosed: true
        },
        orderBy: [
            { year: 'desc' },
            { weekNumber: 'desc' }
        ],
        select: { targetReached: true, weekNumber: true, year: true },
        take: 12 // Last 3 months
    });

    if (plans.length === 0) return 0;

    let streak = 0;
    for (const plan of plans) {
        if (plan.targetReached === true) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
