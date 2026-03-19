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
        const { reportId } = await req.json();

        if (!reportId) {
            return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
        }

        // Verify report belongs to this project
        const report = await prisma.dailyReport.findFirst({
            where: { id: reportId, projectId }
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // DailyTaskProgress, Attendance, BlockageLog all cascade on delete
        await prisma.dailyReport.delete({
            where: { id: reportId }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin report delete error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
