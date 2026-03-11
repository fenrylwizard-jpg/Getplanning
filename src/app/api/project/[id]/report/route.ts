import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateXpAward, getLevelFromXp } from '@/lib/xp-engine';
import { getConsecutiveDaysReported, getConsecutiveWeeksTargetReached } from '@/lib/streak-utils';
import { startOfDay } from 'date-fns';

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
            blockageLogs?: Record<string, { reason: string, description: string }>,
            emptyDrumsCount?: number,
            reportDate?: string,         // ISO date string for backfill
            lateReason?: string,         // ABSENT, FORGOT, NO_CONNECTIVITY, OTHER
            lateDescription?: string,
        } = await req.json();
        const { planId, actuals, locations, issues, missedTargetReason, adHocTasks, siteManagerId, workersCount, blockageLogs, reportDate, lateReason, lateDescription } = body;

        const plan = await prisma.weeklyPlan.findUnique({
            where: { id: planId },
            include: { 
                tasks: { include: { task: true } },
                project: true
            }
        });
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

        // Determine the date for this report
        const effectiveDate = reportDate ? startOfDay(new Date(reportDate)) : startOfDay(new Date());

        // Check for existing report on this date
        const existingReport = await prisma.dailyReport.findFirst({
            where: {
                projectId: plan.projectId,
                date: effectiveDate,
            }
        });
        if (existingReport) {
            return NextResponse.json({ error: "A report already exists for this date. Select a different day." }, { status: 409 });
        }

        let achievedMins = 0;

        const transactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create the DailyReport record
            const dailyReport = await tx.dailyReport.create({
                data: {
                    projectId: plan.projectId,
                    siteManagerId: siteManagerId || plan.project.siteManagerId || '',
                    date: effectiveDate,
                    status: 'SUBMITTED',
                    remarks: issues || null,
                    workersCount: typeof workersCount === 'number' ? workersCount : null,
                    lateReason: lateReason || null,
                    lateDescription: lateDescription || null,
                }
            });

            for (const pt of plan.tasks) {
                const actualQty = actuals[pt.id] || 0;
                achievedMins += (actualQty * pt.task.minutesPerUnit);

                const locs = locations?.[pt.id];
                await tx.weeklyPlanTask.update({
                    where: { id: pt.id },
                    data: { 
                        actualQuantity: { increment: actualQty },
                        ...(locs && locs.length > 0 ? { locations: JSON.stringify(locs) } : {})
                    }
                });

                await tx.task.update({
                    where: { id: pt.taskId },
                    data: { completedQuantity: { increment: actualQty } }
                });

                // Create daily task progress linked to the real DailyReport
                const dtp = await tx.dailyTaskProgress.create({
                    data: {
                        quantity: actualQty,
                        hours: (actualQty * pt.task.minutesPerUnit) / 60,
                        taskId: pt.taskId,
                        dailyReportId: dailyReport.id,
                    }
                });

                // Store blockage log if SM exceeded planned quantity
                if (blockageLogs && blockageLogs[pt.id] && blockageLogs[pt.id].reason) {
                    await tx.blockageLog.create({
                        data: {
                            reason: blockageLogs[pt.id].reason,
                            description: blockageLogs[pt.id].description || '',
                            dailyTaskProgressId: dtp.id
                        }
                    });
                }
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

            // Update weekly plan workers count (keep most recent value)
            await tx.weeklyPlan.update({
                where: { id: planId },
                data: {
                    issuesReported: issues,
                    missedTargetReason: missedTargetReason || null,
                    workersCount: workersCount || null,
                }
            });

            // Award XP to SM (reduced for late backfills)
            if (siteManagerId) {
                const sm = await tx.user.findUnique({ where: { id: siteManagerId } });
                if (sm) {
                    const dailyStreak = await getConsecutiveDaysReported(siteManagerId);
                    const weeklyStreak = await getConsecutiveWeeksTargetReached(plan.projectId);

                    const xpResult = calculateXpAward({
                        achievedHours: achievedMins / 60,
                        targetHoursCapacity: plan.targetHoursCapacity,
                        consecutiveDaysReported: dailyStreak,
                        consecutiveWeeksTargetReached: weeklyStreak,
                        isWeeklySubmission: false, // Daily submission, not weekly close
                    });

                    // Late reports get NO XP
                    const xpMultiplier = lateReason ? 0 : 1.0;
                    const finalXp = Math.round(xpResult.totalXp * xpMultiplier);

                    const newSmXp = sm.xp + finalXp;
                    await tx.user.update({
                        where: { id: siteManagerId },
                        data: { xp: newSmXp, level: getLevelFromXp(newSmXp) }
                    });
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
