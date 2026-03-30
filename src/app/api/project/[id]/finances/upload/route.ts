import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFinances } from "@/lib/parsers/parse-finances";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const snapshots = parseFinances(buffer);

        // Delete old finance snapshots for this project and insert new ones
        await prisma.financeSnapshot.deleteMany({ where: { projectId } });

        // Create upload record
        const upload = await prisma.monthlyUpload.create({
            data: {
                projectId,
                month: new Date(),
                financesFile: file.name,
            },
        });

        if (snapshots.length > 0) {
            await prisma.financeSnapshot.createMany({
                data: snapshots.map(s => ({
                    projectId,
                    uploadId: upload.id,
                    ...s,
                })),
            });
        }

        return NextResponse.json({
            success: true,
            projectId,
            fileName: file.name,
            count: snapshots.length,
        });
    } catch (error) {
        console.error("Finance upload error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
