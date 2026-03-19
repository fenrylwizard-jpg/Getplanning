import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/get-auth-user';

const ADMIN_EMAIL = 'admin@eeg.be';

/**
 * POST: Admin force-delete a report by project + date
 * Body: { projectId: string, date: string (ISO) }
 * Also handles deleting reports that don't show in history ("phantom" reports)
 */
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { projectId, date } = await req.json();
        if (!projectId || !date) {
            return NextResponse.json({ error: 'projectId and date required' }, { status: 400 });
        }

        const targetDate = new Date(date);
        const dayStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0));
        const dayEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate() + 1, 0, 0, 0));

        // Find ALL reports for this project on this date (any timezone representation)
        const reports = await prisma.dailyReport.findMany({
            where: {
                projectId,
                date: { gte: dayStart, lt: dayEnd }
            },
            include: { taskProgress: true }
        });

        if (reports.length === 0) {
            return NextResponse.json({ error: 'No reports found for this date', found: 0 }, { status: 404 });
        }

        let deleted = 0;
        for (const report of reports) {
            // Revert task quantities
            for (const progress of report.taskProgress) {
                if (progress.quantity > 0) {
                    await prisma.task.update({
                        where: { id: progress.taskId },
                        data: { completedQuantity: { decrement: progress.quantity } }
                    }).catch(() => {});

                    // Also revert on WeeklyPlanTask if possible
                    const wpt = await prisma.weeklyPlanTask.findFirst({
                        where: { taskId: progress.taskId, weeklyPlan: { projectId } },
                        orderBy: { createdAt: 'desc' }
                    });
                    if (wpt) {
                        await prisma.weeklyPlanTask.update({
                            where: { id: wpt.id },
                            data: { actualQuantity: { decrement: progress.quantity } }
                        }).catch(() => {});
                    }
                }
            }
            await prisma.dailyReport.delete({ where: { id: report.id } });
            deleted++;
        }

        return NextResponse.json({ success: true, deleted, message: `${deleted} report(s) nuked for ${date}` });
    } catch (e) {
        console.error('Admin nuke error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/**
 * GET: List all reports for a project (admin debug tool)
 * Query: ?projectId=xxx
 */
export async function GET(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const url = new URL(req.url);
        const projectId = url.searchParams.get('projectId');
        if (!projectId) {
            return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }

        const reports = await prisma.dailyReport.findMany({
            where: { projectId },
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                status: true,
                workersCount: true,
                createdAt: true,
                taskProgress: { select: { quantity: true, task: { select: { description: true } } } }
            }
        });

        return NextResponse.json({ reports, total: reports.length });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
