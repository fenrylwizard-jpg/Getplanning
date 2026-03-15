import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const upload = await prisma.monthlyUpload.findFirst({
    where: { projectId },
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      purchasesFile: true,
      financesFile: true,
      etudesFile: true,
      uploadedAt: true,
      month: true,
    },
  });

  // Also get counts of actual parsed records
  const [purchaseCount, financeCount, etudeCount] = await Promise.all([
    prisma.purchaseCategory.count({ where: { projectId } }),
    prisma.financeSnapshot.count({ where: { projectId } }),
    prisma.etudeTask.count({ where: { projectId } }),
  ]);

  return NextResponse.json({
    upload,
    counts: {
      purchases: purchaseCount,
      finances: financeCount,
      etudes: etudeCount,
    },
  });
}
