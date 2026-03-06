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

        // Fetch all closed weekly plans with their completed tasks & project names
        const weeklyPlans = await prisma.weeklyPlan.findMany({
            where: { isClosed: true }, // We only graph closed historical weeks
            include: {
                project: { select: { id: true, name: true } },
                tasks: {
                    include: {
                        task: {
                            select: {
                                minutesPerUnit: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { year: 'asc' },
                { weekNumber: 'asc' }
            ]
        });

        const timeline: Record<string, any> = {};
        const allProjects = new Set<string>();

        // Format: 'YYYY-Wxx'
        for (const plan of weeklyPlans) {
            const timeLabel = `${plan.year}-W${plan.weekNumber.toString().padStart(2, '0')}`;
            if (!timeline[timeLabel]) {
                timeline[timeLabel] = { timeLabel };
            }
            
            const projectName = plan.project.name;
            allProjects.add(projectName);

            // Calculate hours earned in THIS specific week
            // Note: `actualQuantity` in WeeklyPlanTask represents the quantity accomplished during this plan.
            let weekHours = 0;
            for (const wpt of plan.tasks) {
                weekHours += (wpt.actualQuantity * wpt.task.minutesPerUnit) / 60;
            }

            // Sum up if there are multiple plans for same project in same week (shouldn't happen ideally but just in case)
            if (!timeline[timeLabel][projectName]) {
                timeline[timeLabel][projectName] = 0;
            }
            timeline[timeLabel][projectName] += Math.round(weekHours * 100) / 100;
        }

        const data = Object.values(timeline).sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
        const projectsList = Array.from(allProjects).sort();

        // Ensure every time step has 0 for projects that had no plan that week
        for (const d of data) {
            for (const proj of projectsList) {
                if (d[proj] === undefined) {
                    d[proj] = 0;
                }
            }
        }

        return NextResponse.json({
            data,
            projects: projectsList
        });

    } catch (error) {
        console.error("Weekly Stats API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
