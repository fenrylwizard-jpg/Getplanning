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
  
  const documents = await prisma.etudeDocument.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  
  // Re-compute the summaries array exactly like parseDossierTechnique does
  const categoriesMap = new Map<string, { total: number; transmitted: number; statuses: Record<string, number> }>();
  
  // Initialize standard categories so they always appear even if empty
  categoriesMap.set("materiel", { total: 0, transmitted: 0, statuses: {} });
  categoriesMap.set("plans", { total: 0, transmitted: 0, statuses: {} });
  categoriesMap.set("calculs", { total: 0, transmitted: 0, statuses: {} });

  for (const doc of documents) {
      const cat = doc.category || 'materiel';
      if (!categoriesMap.has(cat)) {
          categoriesMap.set(cat, { total: 0, transmitted: 0, statuses: {} });
      }
      const data = categoriesMap.get(cat)!;
      data.total++;

      const st = doc.status || 'PENDING';
      if (st !== 'PENDING') data.transmitted++;
      
      data.statuses[st] = (data.statuses[st] || 0) + 1;
  }

  const summaries = [
      { category: "materiel", label: "Fiches Techniques Matériaux", ...categoriesMap.get("materiel")! },
      { category: "plans", label: "Plans d'Exécution", ...categoriesMap.get("plans")! },
      { category: "calculs", label: "Notes de Calculs", ...categoriesMap.get("calculs")! },
  ];
  
  // Compute summary stats geared towards a Gantt context (keep original logic)
  const summary = {
    total: tasks.length,
    averageProgress: 0,
    byStatus: {} as Record<string, number>,
    byAssignee: {} as Record<string, { total: number; avgProgress: number }>,
  };
  
  let totalProgress = 0;
  let progressCount = 0;

  for (const t of tasks) {
    const status = t.status || 'Non défini';
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

    if (t.progress !== null && t.progress !== undefined) {
      totalProgress += t.progress;
      progressCount++;
    }

    const assignee = t.assignedTo || 'Non assigné';
    if (!summary.byAssignee[assignee]) {
      summary.byAssignee[assignee] = { total: 0, avgProgress: 0 };
    }
    summary.byAssignee[assignee].total++;
    if (t.progress !== null && t.progress !== undefined) {
      summary.byAssignee[assignee].avgProgress += t.progress;
    }
  }

  summary.averageProgress = progressCount > 0 ? totalProgress / progressCount : 0;
  
  for (const assignee in summary.byAssignee) {
    const data = summary.byAssignee[assignee];
    data.avgProgress = data.total > 0 ? data.avgProgress / data.total : 0;
  }
  
  return NextResponse.json({ tasks, summaries, summary });
}
