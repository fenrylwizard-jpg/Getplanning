import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

const ADMIN_EMAIL = 'admin@eeg.be';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const headersList = await headers();
    const userEmail = headersList.get('x-user-email');

    if (userEmail !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { planId, numberOfWorkers, targetReached, issuesReported, missedTargetReason, tasks } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
        }

        // Verify plan belongs to this project
        const plan = await prisma.weeklyPlan.findFirst({
            where: { id: planId, projectId },
        });
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Update weekly plan fields
        const updateData: Record<string, unknown> = {};
        if (numberOfWorkers !== undefined) updateData.numberOfWorkers = parseInt(numberOfWorkers);
        if (targetReached !== undefined) updateData.targetReached = targetReached === true || targetReached === 'true';
        if (issuesReported !== undefined) updateData.issuesReported = issuesReported;
        if (missedTargetReason !== undefined) updateData.missedTargetReason = missedTargetReason;

        await prisma.weeklyPlan.update({
            where: { id: planId },
            data: updateData,
        });

        // Update weekly plan task entries if provided
        if (tasks && Array.isArray(tasks)) {
            for (const t of tasks) {
                if (!t.id) continue;
                const tUpdate: Record<string, unknown> = {};
                if (t.plannedQuantity !== undefined) tUpdate.plannedQuantity = parseFloat(t.plannedQuantity);
                if (t.actualQuantity !== undefined) tUpdate.actualQuantity = parseFloat(t.actualQuantity);

                await prisma.weeklyPlanTask.update({
                    where: { id: t.id },
                    data: tUpdate,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin edit plan error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
