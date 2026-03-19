import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateXpAward, getLevelFromXp } from '@/lib/xp-engine';
import { getConsecutiveDaysReported, getConsecutiveWeeksTargetReached } from '@/lib/streak-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');

    if (!dateQuery) {
        return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    try {
        const queryDate = new Date(dateQuery);
        queryDate.setUTCHours(12, 0, 0, 0);

        // Calculate start and end of the query date in UTC to find the report
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const report = await prisma.dailyReport.findFirst({
            where: {
                projectId: id,
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
            return NextResponse.json({ report: null });
        }

        return NextResponse.json({ report });
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
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

        // Determine the date for this report. 
        // We must avoid startOfDay(new Date(reportDate)) because reportDate is "2026-03-18T23:00:00.000Z" (midnight Paris).
        // Calling startOfDay in a UTC Node environment truncates it to "2026-03-18T00:00:00.000Z" (shifting it back a whole day).
        let effectiveDate: Date;
        if (reportDate) {
            effectiveDate = new Date(reportDate); // Already start of day in the user's localized browser
        } else {
            // If strictly today, get today's date but anchor it to UTC noon to avoid any boundary issues
            const today = new Date();
            effectiveDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0));
        }

        // To ensure absolute stability in the DB unique constraint when matching dates, 
        // we lock all dates to 12:00:00 UTC.
        effectiveDate.setUTCHours(12, 0, 0, 0);

        // Check for existing report on this date
        // We use a date range instead of exact match in case previous buggy dates sit at 00:00 UTC
        const existingReport = await prisma.dailyReport.findFirst({
            where: {
                projectId: plan.projectId,
                date: {
                    gte: new Date(Date.UTC(effectiveDate.getUTCFullYear(), effectiveDate.getUTCMonth(), effectiveDate.getUTCDate(), 0, 0, 0)),
                    lt: new Date(Date.UTC(effectiveDate.getUTCFullYear(), effectiveDate.getUTCMonth(), effectiveDate.getUTCDate() + 1, 0, 0, 0))
                }
            },
            include: { taskProgress: true }
        });
        if (existingReport) {
            if (existingReport.status === 'SUBMITTED') {
                return NextResponse.json({ error: "A report already exists for this date. Select a different day." }, { status: 409 });
            }
            // DRAFT/zombie report — clean it up so the SM can resubmit
            for (const progress of existingReport.taskProgress) {
                if (progress.quantity > 0) {
                    await prisma.task.update({
                        where: { id: progress.taskId },
                        data: { completedQuantity: { decrement: progress.quantity } }
                    }).catch(() => {}); // ignore if task was deleted
                }
            }
            await prisma.dailyReport.delete({ where: { id: existingReport.id } });
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
            const resolvedSmId = siteManagerId || plan.project.siteManagerId;
            if (resolvedSmId) {
                const sm = await tx.user.findUnique({ where: { id: resolvedSmId } });
                if (sm) {
                    const dailyStreak = await getConsecutiveDaysReported(resolvedSmId);
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
                    const newLevel = getLevelFromXp(newSmXp);
                    await tx.user.update({
                        where: { id: resolvedSmId },
                        data: { xp: newSmXp, level: newLevel }
                    });

                    // ── Badge Awarding ──
                    const earnedBadges = await tx.userBadge.findMany({
                        where: { userId: resolvedSmId },
                        include: { badge: true }
                    });
                    const earnedCodes = new Set(earnedBadges.map(ub => ub.badge.code));

                    const badgesToAward: string[] = [];

                    // FIRST_REPORT: first daily report ever
                    if (!earnedCodes.has('FIRST_REPORT')) {
                        badgesToAward.push('FIRST_REPORT');
                    }

                    // STREAK_5 / STREAK_10: consecutive days
                    if (!earnedCodes.has('STREAK_5') && dailyStreak >= 5) {
                        badgesToAward.push('STREAK_5');
                    }
                    if (!earnedCodes.has('STREAK_10') && dailyStreak >= 10) {
                        badgesToAward.push('STREAK_10');
                    }

                    // LEVEL_5 / LEVEL_10: level milestones
                    if (!earnedCodes.has('LEVEL_5') && newLevel >= 5) {
                        badgesToAward.push('LEVEL_5');
                    }
                    if (!earnedCodes.has('LEVEL_10') && newLevel >= 10) {
                        badgesToAward.push('LEVEL_10');
                    }

                    // EARLY_BIRD: report submitted before 8 AM
                    if (!earnedCodes.has('EARLY_BIRD') && new Date().getHours() < 8) {
                        badgesToAward.push('EARLY_BIRD');
                    }

                    // PERFECT_WEEK: 100%+ weekly efficiency (check latest closed plan)
                    if (!earnedCodes.has('PERFECT_WEEK') && weeklyStreak >= 1) {
                        badgesToAward.push('PERFECT_WEEK');
                    }

                    // OVERTIME_HERO: 150%+ weekly achievement
                    if (!earnedCodes.has('OVERTIME_HERO') && plan.targetHoursCapacity > 0) {
                        const weeklyActual = plan.tasks.reduce((sum, t) => sum + (t.actualQuantity * t.task.minutesPerUnit), 0) / 60;
                        if ((weeklyActual / plan.targetHoursCapacity) >= 1.5) {
                            badgesToAward.push('OVERTIME_HERO');
                        }
                    }

                    // Award badges
                    for (const code of badgesToAward) {
                        const badge = await tx.badge.findUnique({ where: { code } });
                        if (badge) {
                            await tx.userBadge.create({
                                data: { userId: resolvedSmId, badgeId: badge.id }
                            }).catch(() => {}); // ignore duplicate
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
