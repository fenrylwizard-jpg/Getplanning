import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { buildWeeklySummaryHtml } from '@/lib/email-templates';

/**
 * GET /api/cron/weekly-summary
 * Generates and sends weekly summary emails for all active projects.
 * Should be called via cron job every Monday morning.
 */
export async function GET() {
    try {
        // Get current week number
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        const year = now.getFullYear();

        // Find all projects with their managers
        const projects = await prisma.project.findMany({
            include: {
                projectManager: true,
                siteManager: true,
                tasks: true,
                weeklyPlans: {
                    where: {
                        weekNumber: weekNumber - 1, // Last week's data
                        year,
                    },
                    include: {
                        tasks: {
                            include: { task: true },
                        },
                    },
                },
            },
        });

        const results: { project: string; sent: boolean; error?: string }[] = [];

        for (const project of projects) {
            // Skip projects with no weekly plans from last week
            const lastWeekPlan = project.weeklyPlans[0];
            if (!lastWeekPlan) {
                results.push({ project: project.name, sent: false, error: 'No plan for last week' });
                continue;
            }

            // Calculate metrics
            const totalTasks = project.tasks.length;
            const totalQuantity = project.tasks.reduce((sum, t) => sum + t.quantity, 0);
            const completedQuantity = project.tasks.reduce((sum, t) => sum + t.completedQuantity, 0);
            const completionPercent = totalQuantity > 0 ? (completedQuantity / totalQuantity) * 100 : 0;

            const plannedHours = lastWeekPlan.targetHoursCapacity;
            let achievedMins = 0;

            const tasksWithProgress = lastWeekPlan.tasks.map(pt => {
                achievedMins += pt.actualQuantity * pt.task.minutesPerUnit;
                return {
                    name: pt.task.description,
                    planned: pt.plannedQuantity,
                    actual: pt.actualQuantity,
                    unit: pt.task.unit,
                };
            }).filter(t => t.planned > 0 || t.actual > 0);

            const achievedHours = achievedMins / 60;
            const efficiency = plannedHours > 0 ? (achievedHours / plannedHours) * 100 : 0;

            const summary = {
                projectName: project.name,
                siteManagerName: project.siteManager?.name || 'Non assigné',
                totalTasks,
                completedTasks: project.tasks.filter(t => t.completedQuantity >= t.quantity).length,
                completionPercent,
                plannedHours,
                achievedHours,
                efficiency,
                weekNumber: weekNumber - 1,
                year,
                tasksWithProgress,
                issues: lastWeekPlan.issuesReported || null,
            };

            const html = buildWeeklySummaryHtml(summary);

            // Send to PM (always) and SM (if assigned)
            const recipients: string[] = [project.projectManager.email];
            if (project.siteManager) {
                recipients.push(project.siteManager.email);
            }

            const emailResult = await sendEmail({
                to: recipients,
                subject: `📋 Rapport S${weekNumber - 1} — ${project.name}`,
                html,
            });

            results.push({
                project: project.name,
                sent: emailResult.success,
                error: emailResult.success ? undefined : String(emailResult.error),
            });
        }

        return NextResponse.json({
            success: true,
            week: weekNumber - 1,
            year,
            results,
        });
    } catch (err) {
        console.error('Weekly summary error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
