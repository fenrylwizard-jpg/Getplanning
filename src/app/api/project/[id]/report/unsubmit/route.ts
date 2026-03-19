import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    try {
        const body: { date?: string } = await req.json();
        const { date } = body;

        if (!date) {
            return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
        }

        const queryDate = new Date(date);
        
        // Calculate start and end of the query date in UTC to find the report
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Find the report to delete
        const report = await prisma.dailyReport.findFirst({
            where: {
                projectId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                taskProgress: true
            }
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Revert the actualQuantity and completedQuantity increments from this report
        for (const progress of report.taskProgress) {
            if (progress.quantity > 0) {
                // Revert the task's completedQuantity
                await prisma.task.update({
                    where: { id: progress.taskId },
                    data: { completedQuantity: { decrement: progress.quantity } }
                });

                // Revert the weekly plan task's actualQuantity
                const weeklyPlanTask = await prisma.weeklyPlanTask.findFirst({
                    where: { taskId: progress.taskId },
                    orderBy: { createdAt: 'desc' }
                });
                if (weeklyPlanTask) {
                    await prisma.weeklyPlanTask.update({
                        where: { id: weeklyPlanTask.id },
                        data: { actualQuantity: { decrement: progress.quantity } }
                    });
                }
            }
        }

        // Delete the report entirely (Attendance, DailyTaskProgress, BlockageLog cascade on delete)
        await prisma.dailyReport.delete({
            where: { id: report.id }
        });

        return NextResponse.json({ success: true, deleted: true });
    } catch (err) {
        console.error("Error unsubmitting (deleting) report:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

