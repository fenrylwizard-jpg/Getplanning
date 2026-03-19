import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const plans = await prisma.weeklyPlan.findMany({
        where: { project: { name: { contains: 'Herlin' } }, weekNumber: 12, year: 2026 },
        include: {
            tasks: { include: { task: true } }
        }
    });

    console.log("Weekly plans found:", plans.length);
    for (const p of plans) {
        console.log(`Plan ID: ${p.id}`);
        let totalH = 0;
        let actH = 0;
        for (const pt of p.tasks) {
            const planned = (pt.plannedQuantity * pt.task.minutesPerUnit) / 60;
            const actual = (pt.actualQuantity * pt.task.minutesPerUnit) / 60;
            totalH += planned;
            actH += actual;
        }
        console.log(`Plan totalH: ${totalH}, actuallH: ${actH}`);
    }

    const reports = await prisma.dailyReport.findMany({
        where: { project: { name: { contains: 'Herlin' } } },
        include: { taskProgress: { include: { task: true } } }
    });

    console.log("\nDaily Reports:");
    for (const r of reports) {
        let hrs = 0;
        for (const tp of r.taskProgress) {
            hrs += (tp.quantity * tp.task.minutesPerUnit) / 60;
        }
        console.log(`Report ${r.date.toISOString()} [${r.status}]: ${hrs.toFixed(2)}h`);
    }
}
check().finally(() => prisma.$disconnect());
