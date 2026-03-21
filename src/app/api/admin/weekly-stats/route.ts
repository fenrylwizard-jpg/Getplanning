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

        // Fetch all weekly plans (both open and closed) with their tasks & project names
        const weeklyPlans = await prisma.weeklyPlan.findMany({
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

        for (const plan of weeklyPlans) {
            const timeLabel = `${plan.year}-W${plan.weekNumber.toString().padStart(2, '0')}`;
            if (!timeline[timeLabel]) {
                timeline[timeLabel] = { timeLabel };
            }
            
            const projectName = plan.project.name;
            allProjects.add(projectName);

            // Calculate planned and achieved hours for this week
            let plannedHours = 0;
            let achievedHours = 0;
            for (const wpt of plan.tasks) {
                plannedHours += (wpt.plannedQuantity * wpt.task.minutesPerUnit) / 60;
                achievedHours += (wpt.actualQuantity * wpt.task.minutesPerUnit) / 60;
            }

            // Keys: "ProjectName_planned", "ProjectName_achieved"
            const plannedKey = `${projectName}_planned`;
            const achievedKey = `${projectName}_achieved`;

            if (!timeline[timeLabel][plannedKey]) timeline[timeLabel][plannedKey] = 0;
            if (!timeline[timeLabel][achievedKey]) timeline[timeLabel][achievedKey] = 0;

            timeline[timeLabel][plannedKey] += Math.round(plannedHours * 100) / 100;
            timeline[timeLabel][achievedKey] += Math.round(achievedHours * 100) / 100;

            // Also compute productivity % 
            const pctKey = `${projectName}_pct`;
            timeline[timeLabel][pctKey] = plannedHours > 0 
                ? Math.round((achievedHours / plannedHours) * 100) 
                : 0;
        }

        const data = Object.values(timeline).sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
        const projectsList = Array.from(allProjects).sort();

        // Ensure every time step has 0 for projects that had no plan that week
        for (const d of data) {
            for (const proj of projectsList) {
                if (d[`${proj}_planned`] === undefined) d[`${proj}_planned`] = 0;
                if (d[`${proj}_achieved`] === undefined) d[`${proj}_achieved`] = 0;
                if (d[`${proj}_pct`] === undefined) d[`${proj}_pct`] = 0;
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
