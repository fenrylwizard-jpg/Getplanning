import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface TaskUpdate {
    description: string;
    category: string;
    unit: string;
    quantity: number;
    minutesPerUnit: number;
    taskCode: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { tasks, removedDescriptions } = await req.json() as {
            tasks: TaskUpdate[];
            removedDescriptions: string[];
        };

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    select: {
                        id: true,
                        taskCode: true,
                        description: true,
                        completedQuantity: true,
                    }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Build existing task map by description (lowercase)
        const existingMap = new Map(project.tasks.map(t => [t.description.toLowerCase().trim(), t]));

        let updated = 0;
        let added = 0;
        let removed = 0;

        // Process each task from the upload
        for (const task of tasks) {
            const key = task.description.toLowerCase().trim();
            const existing = existingMap.get(key);

            if (existing) {
                // Update existing task — preserve completedQuantity
                await prisma.task.update({
                    where: { id: existing.id },
                    data: {
                        quantity: task.quantity,
                        minutesPerUnit: task.minutesPerUnit,
                        category: task.category,
                        unit: task.unit,
                    }
                });
                updated++;
            } else {
                // Add new task
                await prisma.task.create({
                    data: {
                        taskCode: task.taskCode,
                        description: task.description,
                        category: task.category,
                        unit: task.unit,
                        quantity: task.quantity,
                        minutesPerUnit: task.minutesPerUnit,
                        completedQuantity: 0,
                        projectId: id,
                    }
                });
                added++;
            }
        }

        // Remove tasks that were flagged for deletion
        if (removedDescriptions && removedDescriptions.length > 0) {
            for (const desc of removedDescriptions) {
                const key = desc.toLowerCase().trim();
                const existing = existingMap.get(key);
                if (existing) {
                    // Delete associated daily progress and blockage logs first
                    await prisma.blockageLog.deleteMany({
                        where: { dailyTaskProgress: { taskId: existing.id } }
                    });
                    await prisma.dailyTaskProgress.deleteMany({
                        where: { taskId: existing.id }
                    });
                    await prisma.weeklyPlanTask.deleteMany({
                        where: { taskId: existing.id }
                    });
                    await prisma.task.delete({ where: { id: existing.id } });
                    removed++;
                }
            }
        }

        // Create revision log
        await prisma.revisionLog.create({
            data: {
                projectId: id,
                fileName: 're-upload',
                changesMade: `Mise à jour: ${updated} modifiés, ${added} ajoutés, ${removed} supprimés`,
            }
        });

        return NextResponse.json({
            success: true,
            updated,
            added,
            removed,
        });
    } catch (error) {
        console.error("Re-upload confirm error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to apply changes" },
            { status: 500 }
        );
    }
}
