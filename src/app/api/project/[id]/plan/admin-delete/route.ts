import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/get-auth-user';

const ADMIN_EMAIL = 'admin@eeg.be';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getAuthUser();
    if (!user || user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: projectId } = await params;

    try {
        const { planId } = await req.json();

        if (!planId) {
            return NextResponse.json({ error: 'planId is required' }, { status: 400 });
        }

        // Verify plan belongs to this project
        const plan = await prisma.weeklyPlan.findFirst({
            where: { id: planId, projectId }
        });

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Delete WeeklyPlanTask records first (no onDelete cascade on this relation)
        await prisma.weeklyPlanTask.deleteMany({
            where: { weeklyPlanId: planId }
        });

        // Delete the plan itself
        await prisma.weeklyPlan.delete({
            where: { id: planId }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin plan delete error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
