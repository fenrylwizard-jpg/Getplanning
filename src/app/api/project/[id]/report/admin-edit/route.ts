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
        const { reportId, workersCount, remarks, lateReason, lateDescription, taskProgress } = body;

        if (!reportId) {
            return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });
        }

        // Verify report belongs to this project
        const report = await prisma.dailyReport.findFirst({
            where: { id: reportId, projectId },
        });
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Update the daily report fields
        const updateData: Record<string, unknown> = {};
        if (workersCount !== undefined) updateData.workersCount = parseInt(workersCount);
        if (remarks !== undefined) updateData.remarks = remarks;
        if (lateReason !== undefined) updateData.lateReason = lateReason;
        if (lateDescription !== undefined) updateData.lateDescription = lateDescription;

        await prisma.dailyReport.update({
            where: { id: reportId },
            data: updateData,
        });

        // Update task progress entries if provided
        if (taskProgress && Array.isArray(taskProgress)) {
            for (const tp of taskProgress) {
                if (!tp.id) continue;
                const tpUpdate: Record<string, unknown> = {};
                if (tp.quantity !== undefined) tpUpdate.quantity = parseFloat(tp.quantity);
                if (tp.hours !== undefined) tpUpdate.hours = parseFloat(tp.hours);
                
                await prisma.dailyTaskProgress.update({
                    where: { id: tp.id },
                    data: tpUpdate,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin edit report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
