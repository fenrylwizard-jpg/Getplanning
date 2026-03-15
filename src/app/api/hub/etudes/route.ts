import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }
  
  const tasks = await prisma.etudeTask.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  
  // Compute summary stats geared towards a Gantt context
  const summary = {
    total: tasks.length,
    averageProgress: 0,
    byStatus: {} as Record<string, number>,
    byAssignee: {} as Record<string, { total: number; avgProgress: number }>,
  };
  
  let totalProgress = 0;
  let progressCount = 0;

  for (const t of tasks) {
    // By status
    const status = t.status || 'Non défini';
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

    // Progress
    if (t.progress !== null && t.progress !== undefined) {
      totalProgress += t.progress;
      progressCount++;
    }

    // By assignee
    const assignee = t.assignedTo || 'Non assigné';
    if (!summary.byAssignee[assignee]) {
      summary.byAssignee[assignee] = { total: 0, avgProgress: 0 };
    }
    summary.byAssignee[assignee].total++;
    // We will do a rough sum here and average it after the loop for simplicity
    if (t.progress !== null && t.progress !== undefined) {
      summary.byAssignee[assignee].avgProgress += t.progress;
    }
  }

  summary.averageProgress = progressCount > 0 ? totalProgress / progressCount : 0;
  
  for (const assignee in summary.byAssignee) {
    const data = summary.byAssignee[assignee];
    data.avgProgress = data.total > 0 ? data.avgProgress / data.total : 0;
  }
  
  return NextResponse.json({ tasks, summary });
}
