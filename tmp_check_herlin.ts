import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'Herlin', mode: 'insensitive' } }
  });
  if (!project) {
    console.log('Project not found');
    return;
  }
  console.log('Project:', project.name, project.id);
  
  const negativeTasks = await prisma.weeklyPlanTask.findMany({
    where: {
      plan: { projectId: project.id },
      actualQuantity: { lt: 0 }
    },
    include: {
      task: true,
      plan: true
    }
  });

  console.log('Negative Weekly Tasks:', JSON.stringify(negativeTasks, null, 2));

  // Also check if any daily progress has negative values
  const negativeDailies = await prisma.dailyTaskProgress.findMany({
    where: {
      report: { plan: { projectId: project.id } },
      quantity: { lt: 0 }
    },
    include: {
      report: true,
      task: true
    }
  });
  
  console.log('Negative Daily Tasks:', JSON.stringify(negativeDailies, null, 2));

  // Also check if there are tasks where the sum of daily progresses does not match the actualQuantity on the weekly plan
  const allWeeklyTasks = await prisma.weeklyPlanTask.findMany({
    where: { plan: { projectId: project.id } },
    include: { plan: { include: { dailyReports: { include: { tasks: true } } } } }
  });

  const discrepancies = [];

  for (const wTask of allWeeklyTasks) {
    let sumDailies = 0;
    for (const report of wTask.plan.dailyReports) {
      const dTask = report.tasks.find(t => t.taskId === wTask.taskId);
      if (dTask) {
        sumDailies += dTask.quantity;
      }
    }
    // Float comparison tolerance
    if (Math.abs(sumDailies - wTask.actualQuantity) > 0.001) {
      discrepancies.push({
        weeklyPlanId: wTask.planId,
        taskId: wTask.taskId,
        actualQuantity: wTask.actualQuantity,
        sumDailies: sumDailies,
        weekNumber: wTask.plan.weekNumber
      });
    }
  }

  console.log('Discrepancies:', JSON.stringify(discrepancies, null, 2));

}

main().catch(console.error).finally(() => prisma.$disconnect());
