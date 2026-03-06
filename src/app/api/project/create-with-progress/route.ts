import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            name, 
            pmEmail, 
            siteManagerId, 
            location, 
            subLocations, 
            startDate, 
            endDate,
            tasks // Array of { taskCode, description, category, unit, quantity, minutesPerUnit, initialQty, initialHours }
        } = body;

        if (!name || !pmEmail || !tasks) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const pm = await prisma.user.findUnique({ where: { email: pmEmail } });
        if (!pm) return NextResponse.json({ error: "PM not found" }, { status: 404 });

        const project = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Create Project
            const newProject = await tx.project.create({
                data: {
                    name,
                    projectManagerId: pm.id,
                    siteManagerId: siteManagerId || null,
                    location,
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                }
            });

            // 2. Create Sub-locations
            if (subLocations && subLocations.length > 0) {
                for (const loc of subLocations) {
                    await tx.subLocation.create({
                        data: {
                            name: loc,
                            projectId: newProject.id
                        }
                    });
                }
            }

            // 3. Create Tasks and check for initial progress
            for (const t of tasks) {
                const createdTask = await tx.task.create({
                    data: {
                        projectId: newProject.id,
                        taskCode: t.taskCode,
                        description: t.description,
                        category: t.category,
                        unit: t.unit,
                        quantity: t.quantity,
                        minutesPerUnit: t.minutesPerUnit,
                    }
                });

                // 4. Initial progress if provided
                if ((t.initialQty && t.initialQty > 0) || (t.initialHours && t.initialHours > 0)) {
                    const reportDate = startDate ? new Date(startDate) : new Date();
                    
                    const report = await tx.dailyReport.create({
                        data: {
                            projectId: newProject.id,
                            siteManagerId: siteManagerId || pm.id,
                            date: reportDate,
                            status: 'APPROVED', 
                            remarks: 'Reprise d\'historique au démarrage'
                        }
                    });

                    await tx.dailyTaskProgress.create({
                        data: {
                            dailyReportId: report.id,
                            taskId: createdTask.id,
                            quantity: t.initialQty || 0,
                            hours: t.initialHours || 0,
                        }
                    });
                }
            }

            return newProject;
        });

        return NextResponse.json({ success: true, projectId: project.id });

    } catch (error) {
        console.error("Project creation error:", error);
        const message = error instanceof Error ? error.message : "Failed to create project";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
