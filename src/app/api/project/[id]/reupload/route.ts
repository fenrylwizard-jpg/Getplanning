import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMetre } from "@/lib/metre-skill";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "File is required" }, { status: 400 });
        }

        // Get existing project tasks
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    select: {
                        id: true,
                        taskCode: true,
                        category: true,
                        description: true,
                        unit: true,
                        quantity: true,
                        completedQuantity: true,
                        minutesPerUnit: true,
                    }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Parse uploaded file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const parsed = parseMetre(buffer);

        // Build diff
        const existingMap = new Map(project.tasks.map(t => [t.description.toLowerCase().trim(), t]));
        const newTaskDescriptions = new Set(parsed.tasks.map(t => t.description.toLowerCase().trim()));

        interface DiffItem {
            type: 'modified' | 'added' | 'removed' | 'unchanged';
            taskCode: string;
            description: string;
            category: string;
            unit: string;
            oldQuantity?: number;
            newQuantity?: number;
            oldMinutesPerUnit?: number;
            newMinutesPerUnit?: number;
            completedQuantity?: number;
            // For new tasks
            quantity?: number;
            minutesPerUnit?: number;
        }

        const diff: DiffItem[] = [];

        // Check each uploaded task against existing
        for (const newTask of parsed.tasks) {
            const key = newTask.description.toLowerCase().trim();
            const existing = existingMap.get(key);

            if (existing) {
                // Task exists — check if modified
                const quantityChanged = existing.quantity !== newTask.quantity;
                const minutesChanged = existing.minutesPerUnit !== newTask.minutesPerUnit;

                if (quantityChanged || minutesChanged) {
                    diff.push({
                        type: 'modified',
                        taskCode: existing.taskCode,
                        description: newTask.description,
                        category: newTask.category,
                        unit: newTask.unit,
                        oldQuantity: existing.quantity,
                        newQuantity: newTask.quantity,
                        oldMinutesPerUnit: existing.minutesPerUnit,
                        newMinutesPerUnit: newTask.minutesPerUnit,
                        completedQuantity: existing.completedQuantity,
                    });
                } else {
                    diff.push({
                        type: 'unchanged',
                        taskCode: existing.taskCode,
                        description: existing.description,
                        category: existing.category,
                        unit: existing.unit,
                        oldQuantity: existing.quantity,
                        newQuantity: newTask.quantity,
                        completedQuantity: existing.completedQuantity,
                    });
                }
            } else {
                // New task
                diff.push({
                    type: 'added',
                    taskCode: newTask.taskCode,
                    description: newTask.description,
                    category: newTask.category,
                    unit: newTask.unit,
                    quantity: newTask.quantity,
                    minutesPerUnit: newTask.minutesPerUnit,
                });
            }
        }

        // Check for removed tasks (in DB but not in uploaded file)
        for (const existing of project.tasks) {
            const key = existing.description.toLowerCase().trim();
            if (!newTaskDescriptions.has(key)) {
                diff.push({
                    type: 'removed',
                    taskCode: existing.taskCode,
                    description: existing.description,
                    category: existing.category,
                    unit: existing.unit,
                    oldQuantity: existing.quantity,
                    completedQuantity: existing.completedQuantity,
                });
            }
        }

        const summary = {
            added: diff.filter(d => d.type === 'added').length,
            modified: diff.filter(d => d.type === 'modified').length,
            removed: diff.filter(d => d.type === 'removed').length,
            unchanged: diff.filter(d => d.type === 'unchanged').length,
        };

        return NextResponse.json({
            diff,
            summary,
            parsedTasks: parsed.tasks,
            zones: parsed.zones,
        });
    } catch (error) {
        console.error("Re-upload preview error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to parse" },
            { status: 500 }
        );
    }
}
