import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/get-auth-user';
import { getISOWeek, getISOWeekYear } from 'date-fns';

const ADMIN_EMAIL = 'admin@eeg.be';

/**
 * POST: Admin force-delete a report by exact ID
 * Body: { reportId: string, projectId: string }
 * Handles deleting reports that don't show in history ("phantom" reports)
 */
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { reportId, projectId } = await req.json();
        if (!reportId || !projectId) {
            return NextResponse.json({ error: 'reportId and projectId required' }, { status: 400 });
        }

        // Find the specific report
        const report = await prisma.dailyReport.findUnique({
            where: { id: reportId },
            include: { taskProgress: true }
        });

        if (!report || report.projectId !== projectId) {
            return NextResponse.json({ error: 'Report not found for this project' }, { status: 404 });
        }

            // Revert task quantities
            for (const progress of report.taskProgress) {
                if (progress.quantity > 0) {
                    await prisma.task.update({
                        where: { id: progress.taskId },
                        data: { completedQuantity: { decrement: progress.quantity } }
                    }).catch(() => {});

                    // Also revert on WeeklyPlanTask if possible
                    const reportDate = new Date(report.date);
                    const weekNumber = getISOWeek(reportDate);
                    const year = getISOWeekYear(reportDate);

                    const wpt = await prisma.weeklyPlanTask.findFirst({
                        where: { 
                            taskId: progress.taskId, 
                            weeklyPlan: { 
                                projectId,
                                weekNumber: weekNumber,
                                year: year
                            } 
                        }
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

        return NextResponse.json({ success: true, message: `Report nuked successfully` });
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
