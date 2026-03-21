import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const token = req.headers.get('cookie')?.split('auth-token=')[1]?.split(';')[0];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const weeklyPlans = await prisma.weeklyPlan.findMany({
            include: {
                project: { select: { id: true, name: true } },
                tasks: {
                    include: {
                        task: { select: { minutesPerUnit: true } }
                    }
                }
            },
            orderBy: [
                { year: 'asc' },
                { weekNumber: 'asc' }
            ]
        });

        // Group by timeLabel, tracking per-week planned/achieved per project
        const weeklyData: Record<string, Record<string, { planned: number; achieved: number }>> = {};
        const allProjects = new Set<string>();
        const allWeeks: string[] = [];

        for (const plan of weeklyPlans) {
            const timeLabel = `${plan.year}-W${plan.weekNumber.toString().padStart(2, '0')}`;
            const projectName = plan.project.name;
            allProjects.add(projectName);

            if (!weeklyData[timeLabel]) {
                weeklyData[timeLabel] = {};
                allWeeks.push(timeLabel);
            }
            if (!weeklyData[timeLabel][projectName]) {
                weeklyData[timeLabel][projectName] = { planned: 0, achieved: 0 };
            }

            for (const wpt of plan.tasks) {
                weeklyData[timeLabel][projectName].planned += (wpt.plannedQuantity * wpt.task.minutesPerUnit) / 60;
                weeklyData[timeLabel][projectName].achieved += (wpt.actualQuantity * wpt.task.minutesPerUnit) / 60;
            }
        }

        // Sort weeks chronologically
        const sortedWeeks = [...new Set(allWeeks)].sort();
        const projectsList = Array.from(allProjects).sort();

        // Build CUMULATIVE data: each week = sum of all previous weeks + current week
        const cumulativeTotals: Record<string, { planned: number; achieved: number }> = {};
        for (const proj of projectsList) {
            cumulativeTotals[proj] = { planned: 0, achieved: 0 };
        }

        const data = sortedWeeks.map(week => {
            const point: Record<string, any> = { timeLabel: week };

            for (const proj of projectsList) {
                const weekVal = weeklyData[week]?.[proj] || { planned: 0, achieved: 0 };
                cumulativeTotals[proj].planned += weekVal.planned;
                cumulativeTotals[proj].achieved += weekVal.achieved;

                // Cumulative values (always >= 0)
                point[`${proj}_planned`] = Math.round(cumulativeTotals[proj].planned * 10) / 10;
                point[`${proj}_achieved`] = Math.round(cumulativeTotals[proj].achieved * 10) / 10;

                // Productivity % for this specific week
                point[`${proj}_pct`] = weekVal.planned > 0
                    ? Math.round((weekVal.achieved / weekVal.planned) * 100)
                    : 0;
            }

            return point;
        });

        return NextResponse.json({ data, projects: projectsList });

    } catch (error) {
        console.error("Weekly Stats API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
