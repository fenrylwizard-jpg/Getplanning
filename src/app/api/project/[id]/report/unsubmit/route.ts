import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getISOWeek, getISOWeekYear } from 'date-fns';

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
        
        // Apply the same timezone normalization as the submit endpoint:
        // CET midnight comes in as UTC 23:00 — shift forward to find the correct day
        if (date.includes('T') && queryDate.getUTCHours() >= 21) {
            queryDate.setTime(queryDate.getTime() + 4 * 60 * 60 * 1000);
        }
        queryDate.setUTCHours(12, 0, 0, 0);

        // Search the full calendar day in UTC
        const startOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate() + 1, 0, 0, 0));

        // Find the report to delete
        const report = await prisma.dailyReport.findFirst({
            where: {
                projectId,
                date: {
                    gte: startOfDay,
                    lt: endOfDay
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
                const reportDate = new Date(report.date);
                const weekNumber = getISOWeek(reportDate);
                const year = getISOWeekYear(reportDate);

                const weeklyPlanTask = await prisma.weeklyPlanTask.findFirst({
                    where: { 
                        taskId: progress.taskId,
                        weeklyPlan: {
                            projectId,
                            weekNumber: weekNumber,
                            year: year
                        }
                    }
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

