import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
    try {
        const now = new Date();
        const currentWeek = getISOWeek(now);
        const currentYear = getYear(now);

        // Find the plan for the current week (regardless of submission status)
        let plan = await prisma.weeklyPlan.findFirst({
            where: { projectId: id, weekNumber: currentWeek, year: currentYear },
            orderBy: { createdAt: 'desc' },
            include: {
                tasks: {
                    include: { task: true }
                }
            }
        });

        // Fallback: if no plan for current week, find the most recent plan
        if (!plan) {
            plan = await prisma.weeklyPlan.findFirst({
                where: { projectId: id },
                orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }, { createdAt: 'desc' }],
                include: {
                    tasks: {
                        include: { task: true }
                    }
                }
            });
        }

        if (!plan) {
            return NextResponse.json({ plan: null });
        }

        // Calculate start/end dates strictly in UTC to avoid local timezone/DST shifts
        const targetYear = plan.year;
        const targetWeek = plan.weekNumber;
        
        // Find Jan 4th of the target year at 12:00:00 UTC (Jan 4th is always in ISO Week 1)
        const jan4 = new Date(Date.UTC(targetYear, 0, 4, 12, 0, 0));
        const dayOfWeekJan4 = jan4.getUTCDay() || 7; // 1=Mon, 7=Sun
        
        // Find Monday of Week 1
        const week1Start = new Date(jan4);
        week1Start.setUTCDate(jan4.getUTCDate() - dayOfWeekJan4 + 1);
        
        // Add (targetWeek - 1) weeks
        const isoWeekStart = new Date(week1Start);
        isoWeekStart.setUTCDate(week1Start.getUTCDate() + (targetWeek - 1) * 7);
        isoWeekStart.setUTCHours(0, 0, 0, 0); // Start of Monday
        
        const isoWeekEnd = new Date(isoWeekStart);
        isoWeekEnd.setUTCDate(isoWeekStart.getUTCDate() + 6);
        isoWeekEnd.setUTCHours(23, 59, 59, 999); // End of Sunday

        // Find existing DailyReports for this project within this week
        const existingReports = await prisma.dailyReport.findMany({
            where: {
                projectId: id,
                date: {
                    gte: isoWeekStart,
                    lte: isoWeekEnd,
                },
            },
            select: {
                id: true,
                date: true,
                status: true,
            },
            orderBy: { date: 'asc' },
        });

        // Get sub-locations for the project
        const project = await prisma.project.findUnique({
            where: { id },
            include: { subLocations: true },
        });

        const subLocations = project?.subLocations?.map((sl: { name: string }) => sl.name) || [];

        return NextResponse.json({
            plan,
            weekNumber: plan.weekNumber,
            year: plan.year,
            weekStart: isoWeekStart.toISOString(),
            weekEnd: isoWeekEnd.toISOString(),
            existingReports: existingReports.map(r => ({
                id: r.id,
                date: r.date.toISOString(),
                status: r.status,
            })),
            subLocations,
        });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}
