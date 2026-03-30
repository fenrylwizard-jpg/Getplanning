import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }
  
  const categories = await prisma.purchaseCategory.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  
  return NextResponse.json({ categories });
}
