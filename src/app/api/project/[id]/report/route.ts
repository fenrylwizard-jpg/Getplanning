import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateXpAward, getLevelFromXp } from '@/lib/xp-engine';
import { getConsecutiveDaysReported, getConsecutiveWeeksTargetReached } from '@/lib/streak-utils';

export async function POST(req: Request) {
    try {
        const body: { 
            planId: string, 
            actuals: Record<string, number>, 
            locations?: Record<string, string[]>,
            issues: string, 
            missedTargetReason?: string,
            adHocTasks?: { tempId: string, taskId: string, actualQuantity: number, locations?: string[] }[],
            siteManagerId?: string,
            workersCount?: number,
        } = await req.json();
        const { planId, actuals, locations, issues, missedTargetReason, adHocTasks, siteManagerId, workersCount } = body;

        const plan = await prisma.weeklyPlan.findUnique({
            where: { id: planId },
            include: { 
                tasks: { include: { task: true } },
                project: true
            }
        });
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

        let achievedMins = 0;

        const transactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            for (const pt of plan.tasks) {
                const actualQty = actuals[pt.id] || 0;
                achievedMins += (actualQty * pt.task.minutesPerUnit);

                const locs = locations?.[pt.id];
                await tx.weeklyPlanTask.update({
                    where: { id: pt.id },
                    data: { 
                        actualQuantity: actualQty,
                        ...(locs && locs.length > 0 ? { locations: JSON.stringify(locs) } : {})
                    }
                });

                await tx.task.update({
                    where: { id: pt.taskId },
                    data: { completedQuantity: { increment: actualQty } }
                });
            }
            
            const adHocIdsMapping: Record<string, string> = {};

            if (adHocTasks && adHocTasks.length > 0) {
                for (const adHoc of adHocTasks) {
                    if (adHoc.actualQuantity <= 0) continue;

                    const task = await tx.task.findUnique({ where: { id: adHoc.taskId } });
                    if (!task) continue;

                    achievedMins += (adHoc.actualQuantity * task.minutesPerUnit);

                    const newWpt = await tx.weeklyPlanTask.create({
                        data: {
                            weeklyPlanId: planId,
                            taskId: adHoc.taskId,
                            plannedQuantity: 0,
                            actualQuantity: adHoc.actualQuantity,
                            ...(adHoc.locations && adHoc.locations.length > 0 ? { locations: JSON.stringify(adHoc.locations) } : {})
                        }
                    });

                    adHocIdsMapping[adHoc.tempId] = newWpt.id;

                    await tx.task.update({
                        where: { id: adHoc.taskId },
                        data: { completedQuantity: { increment: adHoc.actualQuantity } }
                    });
                }
            }

            const achievedHours = achievedMins / 60;
            const targetReached = achievedHours >= plan.targetHoursCapacity;

            await tx.weeklyPlan.update({
                where: { id: planId },
                data: {
                    isSubmitted: true,
                    isClosed: true,
                    targetReached,
                    issuesReported: issues,
                    missedTargetReason: missedTargetReason || null,
                    workersCount: workersCount || null,
                }
            });

            // Award XP to SM
            if (siteManagerId) {
                const sm = await tx.user.findUnique({ where: { id: siteManagerId } });
                if (sm) {
                    const dailyStreak = await getConsecutiveDaysReported(siteManagerId);
                    const weeklyStreak = await getConsecutiveWeeksTargetReached(plan.projectId);

                    const xpResult = calculateXpAward({
                        achievedHours,
                        targetHoursCapacity: plan.targetHoursCapacity,
                        consecutiveDaysReported: dailyStreak,
                        consecutiveWeeksTargetReached: weeklyStreak,
                        isWeeklySubmission: true,
                    });

                    const newSmXp = sm.xp + xpResult.totalXp;
                    await tx.user.update({
                        where: { id: siteManagerId },
                        data: { xp: newSmXp, level: getLevelFromXp(newSmXp) }
                    });

                    // Passive XP for PM if target reached
                    if (targetReached && plan.project.projectManagerId) {
                        const pm = await tx.user.findUnique({ where: { id: plan.project.projectManagerId } });
                        if (pm) {
                            const newPmXp = pm.xp + 50;
                            await tx.user.update({
                                where: { id: plan.project.projectManagerId },
                                data: { xp: newPmXp, level: getLevelFromXp(newPmXp) }
                            });
                        }
                    }
                }
            }
            return { success: true, adHocIdsMapping };
        });

        return NextResponse.json(transactionResult);
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}
