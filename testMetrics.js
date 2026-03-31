const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getISOWeek, getISOWeekYear } = require('date-fns');

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: { contains: 'Herlin' } },
        include: {
            tasks: true,
            weeklyPlans: true,
            dailyReports: {
                include: { taskProgress: true }
            }
        }
    });

    if (!project) return console.log('Herlin not found');

    let earnedTotal = 0;
    project.tasks.forEach(t => {
        earnedTotal += (t.completedQuantity * t.minutesPerUnit) / 60;
    });

    const planHoursLookup = new Map();
    project.weeklyPlans.forEach(p => {
        planHoursLookup.set(`${p.year}-${p.weekNumber}`, p.hoursPerWorker || 40);
    });

    let usedTotal = 0;
    let reportEarnedTotal = 0;

    project.dailyReports.forEach(r => {
        if (r.status !== 'DRAFT') {
            const wk = getISOWeek(r.date);
            const yr = getISOWeekYear(r.date);
            const key = `${yr}-${wk}`;
            
            const weeklyHrs = planHoursLookup.get(key) || 40;
            const dailyHrs = weeklyHrs / 5;

            let reportEarned = 0;
            r.taskProgress.forEach(tp => reportEarned += tp.hours || 0);
            reportEarnedTotal += reportEarned;

            const used = r.workersCount ? (r.workersCount * dailyHrs) : 0;
            usedTotal += used;

            console.log(`[${r.date.toISOString().split('T')[0]}] W${wk} Workers=${r.workersCount || 0} -> Used: ${used.toFixed(1)}h | Earned: ${reportEarned.toFixed(1)}h`);
        }
    });

    console.log(`\nGlobal Earned (from tasks): ${earnedTotal.toFixed(1)}h`);
    console.log(`Global Earned (from reports): ${reportEarnedTotal.toFixed(1)}h`);
    console.log(`Global Used: ${usedTotal.toFixed(1)}h`);
    console.log(`Global Efficiency (Tasks / Used): ${usedTotal ? (earnedTotal/usedTotal*100).toFixed(1) : 0}%`);
    console.log(`Global Efficiency (Reports / Used): ${usedTotal ? (reportEarnedTotal/usedTotal*100).toFixed(1) : 0}%`);
}

main().finally(() => prisma.$disconnect());
