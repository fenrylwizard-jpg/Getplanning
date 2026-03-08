import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple protection
    if (secret !== 'eeg-chrono') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const project = await prisma.project.findFirst({
            where: { name: 'Herlin E2E Test' },
            include: { tasks: true }
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        
        const smId = project.siteManagerId;
        if (!smId) return NextResponse.json({ error: 'Project has no SM' }, { status: 400 });

        // Generate 3 weeks of data (Mon-Fri) ending yesterday
        const reports = [];
        let dateCounter = new Date();
        dateCounter.setDate(dateCounter.getDate() - 22); // Start ~3 weeks ago

        // Pick 5 tasks to progress on
        const activeTasks = project.tasks.slice(0, 5);

        for (let i = 0; i < 21; i++) {
            dateCounter.setDate(dateCounter.getDate() + 1);
            
            // Skip weekends
            if (dateCounter.getDay() === 0 || dateCounter.getDay() === 6) continue;
            
            // Don't generate for today or future
            if (dateCounter >= new Date()) break;

            const report = await prisma.dailyReport.create({
                data: {
                    projectId: project.id,
                    siteManagerId: smId,
                    date: new Date(dateCounter),
                    status: 'APPROVED',
                    remarks: `E2E Simulated historical report for ${dateCounter.toDateString()}`,
                    weather: 'Beau',
                    progress: {
                        create: activeTasks.map(t => ({
                            taskId: t.id,
                            quantity: Math.floor(Math.random() * 5) + 1, // Random 1-5 qty
                            hours: Math.floor(Math.random() * 3) + 1     // Random 1-3 hours
                        }))
                    }
                }
            });
            reports.push(report);
        }

        return NextResponse.json({ success: true, generatedReports: reports.length });

    } catch (error) {
        console.error("Failed to generate historical data:", error);
        return NextResponse.json({ error: 'Failed to generate data', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
