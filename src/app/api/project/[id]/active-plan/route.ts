import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getISOWeek, getYear, startOfISOWeek, endOfISOWeek, startOfDay, endOfDay } from 'date-fns';

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

        // Calculate start/end dates from the plan's week/year
        const jan4 = new Date(plan.year, 0, 4);
        const startOfYear = startOfISOWeek(jan4);
        const weekStart = new Date(startOfYear);
        weekStart.setDate(weekStart.getDate() + (plan.weekNumber - 1) * 7);
        const isoWeekStart = startOfISOWeek(weekStart);
        const isoWeekEnd = endOfISOWeek(weekStart);

        // Find existing DailyReports for this project within this week
        const existingReports = await prisma.dailyReport.findMany({
            where: {
                projectId: id,
                date: {
                    gte: startOfDay(isoWeekStart),
                    lte: endOfDay(isoWeekEnd),
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
