import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEtudes } from "@/lib/parsers/parse-etudes";
import { parseDossierTechnique } from "@/lib/parsers/parse-dossier-technique";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Parse both the Gantt tasks AND the dossier technique sheets
        const tasks = parseEtudes(buffer);
        const { documents, summaries } = parseDossierTechnique(buffer);

        // Delete old etude tasks for this project and insert new ones
        await prisma.etudeTask.deleteMany({ where: { projectId } });

        // Create upload record
        const upload = await prisma.monthlyUpload.create({
            data: {
                projectId,
                month: new Date(),
                etudesFile: file.name,
            },
        });

        if (tasks.length > 0) {
            await prisma.etudeTask.createMany({
                data: tasks.map(t => ({
                    projectId,
                    uploadId: upload.id,
                    ...t,
                })),
            });
        }

        const totalCount = tasks.length + documents.length;

        return NextResponse.json({
            success: true,
            projectId,
            fileName: file.name,
            count: totalCount,
            details: {
                ganttTasks: tasks.length,
                dossierDocuments: documents.length,
                summaries,
            },
        });
    } catch (error) {
        console.error("Technique upload error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
