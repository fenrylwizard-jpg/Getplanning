import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const project_id = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const week = searchParams.get('week');
    const year = searchParams.get('year');

    try {
        if (week && year) {
            const plan = await prisma.weeklyPlan.findFirst({
                where: {
                    projectId: project_id,
                    weekNumber: parseInt(week),
                    year: parseInt(year)
                },
                include: {
                    tasks: {
                        include: {
                            task: true
                        }
                    }
                }
            });
            return NextResponse.json(plan);
        }

        const plans = await prisma.weeklyPlan.findMany({
            where: { projectId: project_id },
            orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
            include: {
                tasks: {
                    include: {
                        task: true
                    }
                }
            }
        });
        return NextResponse.json(plans);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
    try {
        const { workers, targetHoursCapacity, hoursPerWorker, tasks, checks, weekNumber: requestedWeek, year: requestedYear } = await req.json();

        // Fallback to next week if not provided
        let weekNumber = requestedWeek;
        let year = requestedYear;

        if (!weekNumber || !year) {
            const nextWeekDate = new Date();
            nextWeekDate.setDate(nextWeekDate.getDate() + 7);
            weekNumber = getISOWeek(nextWeekDate);
            year = getYear(nextWeekDate);
        }

        // Check if plan already exists for this week/year
        const existing = await prisma.weeklyPlan.findFirst({
            where: {
                projectId: id,
                weekNumber,
                year
            }
        });

        if (existing) {
            // Update existing or throw error? Usually we'd want to update or prevent duplicates.
            // For now, let's delete the old one or update it. Delete and recreate is safest for tasks.
            await prisma.weeklyPlanTask.deleteMany({ where: { weeklyPlanId: existing.id } });
            await prisma.weeklyPlan.delete({ where: { id: existing.id } });
        }

        const plan = await prisma.weeklyPlan.create({
            data: {
                weekNumber,
                year,
                numberOfWorkers: workers,
                hoursPerWorker: hoursPerWorker || 40,
                targetHoursCapacity,
                projectId: id,
                hasDrawings: checks.drawings,
                hasMaterials: checks.materials,
                hasTools: checks.tools,
                hasSubcontractors: checks.sub,
                tasks: {
                    create: tasks.map((t: { taskId: string, planQty: number, locations?: string[] }) => ({
                        taskId: t.taskId,
                        plannedQuantity: t.planQty,
                        locations: t.locations && t.locations.length > 0 ? JSON.stringify(t.locations) : null
                    }))
                }
            }
        });

        return NextResponse.json({ success: true, planId: plan.id });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}

// PATCH: Update workforce parameters (workers, hoursPerWorker) on an existing plan
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    try {
        const { weekNumber, year, workers, hoursPerWorker } = await req.json();
        if (!weekNumber || !year) {
            return NextResponse.json({ error: 'weekNumber and year are required' }, { status: 400 });
        }

        const plan = await prisma.weeklyPlan.findFirst({
            where: { projectId, weekNumber, year }
        });

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const updated = await prisma.weeklyPlan.update({
            where: { id: plan.id },
            data: {
                numberOfWorkers: workers ?? plan.numberOfWorkers,
                hoursPerWorker: hoursPerWorker ?? plan.hoursPerWorker,
                targetHoursCapacity: (workers ?? plan.numberOfWorkers) * (hoursPerWorker ?? plan.hoursPerWorker),
            }
        });

        return NextResponse.json({ success: true, plan: updated });
    } catch (err) {
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
}
