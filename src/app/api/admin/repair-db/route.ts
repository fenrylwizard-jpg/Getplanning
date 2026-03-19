import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export async function GET(req: Request) {
    try {
        console.log("Starting DB Repair...");
        
        const weeklyPlans = await prisma.weeklyPlan.findMany({
            include: {
                tasks: { include: { task: true } },
                project: {
                    include: {
                        dailyReports: {
                            where: { status: 'SUBMITTED' },
                            include: { taskProgress: true }
                        }
                    }
                }
            }
        });

        console.log(`Found ${weeklyPlans.length} weekly plans to check`);
        let fixedCount = 0;

        for (const plan of weeklyPlans) {
            // Find reports for this week
            const reportsThisWeek = plan.project.dailyReports.filter(r => {
                const d = new Date(r.date);
                return getISOWeek(d) === plan.weekNumber && getISOWeekYear(d) === plan.year;
            });

            for (const wpt of plan.tasks) {
                // Calculate accurate quantity from daily progress
                let trueActualQuantity = 0;
                for (const report of reportsThisWeek) {
                    const progressForThisTask = report.taskProgress.find(p => p.taskId === wpt.taskId);
                    if (progressForThisTask) {
                        trueActualQuantity += progressForThisTask.quantity;
                    }
                }

                if (wpt.actualQuantity !== trueActualQuantity) {
                    console.log(`Fixing WPT ${wpt.id}: ${wpt.actualQuantity} -> ${trueActualQuantity}`);
                    await prisma.weeklyPlanTask.update({
                        where: { id: wpt.id },
                        data: { actualQuantity: trueActualQuantity }
                    });
                    fixedCount++;
                }
            }
        }
        console.log(`DB Repair Complete! Fixed ${fixedCount} tasks.`);
        return NextResponse.json({ success: true, fixedCount });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
