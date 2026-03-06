import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
    try {
        // Find latest unsubmitted plan
        const plan = await prisma.weeklyPlan.findFirst({
            where: { projectId: id, isSubmitted: false },
            orderBy: { createdAt: 'desc' },
            include: {
                tasks: {
                    include: { task: true }
                }
            }
        });

        return NextResponse.json({ plan });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}
