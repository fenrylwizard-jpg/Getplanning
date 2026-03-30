import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
    try {
        const { weekNumber, year } = await req.json();

        if (!weekNumber || !year) {
            return NextResponse.json({ error: 'Week and Year required' }, { status: 400 });
        }

        const existing = await prisma.weeklyPlan.findFirst({
            where: {
                projectId: id,
                weekNumber,
                year
            }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const unsubmitted = await prisma.weeklyPlan.update({
            where: { id: existing.id },
            data: { isSubmitted: false }
        });

        return NextResponse.json({ success: true, plan: unsubmitted });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}
