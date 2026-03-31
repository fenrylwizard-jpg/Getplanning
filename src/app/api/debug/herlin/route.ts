import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const project = await prisma.project.findFirst({
      where: { name: { contains: 'Herlin', mode: 'insensitive' } }
    });
    
    if (!project) return NextResponse.json({ error: 'Project not found' });

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

    return NextResponse.json({
      project: { id: project.id, name: project.name },
      negativeTasks,
      negativeDailies,
      discrepancies
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
