import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePurchases } from "@/lib/parsers/parse-purchases";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const categories = parsePurchases(buffer);

        // Delete old purchases for this project and insert new ones
        await prisma.purchaseCategory.deleteMany({ where: { projectId } });

        // Create upload record
        const upload = await prisma.monthlyUpload.create({
            data: {
                projectId,
                month: new Date(),
                purchasesFile: file.name,
            },
        });

        if (categories.length > 0) {
            await prisma.purchaseCategory.createMany({
                data: categories.map(c => ({
                    projectId,
                    uploadId: upload.id,
                    ...c,
                })),
            });
        }

        return NextResponse.json({
            success: true,
            projectId,
            fileName: file.name,
            count: categories.length,
        });
    } catch (error) {
        console.error("Purchases upload error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
