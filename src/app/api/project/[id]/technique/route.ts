import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const documents = await prisma.technicalDocument.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ documents });
    } catch {
        return NextResponse.json({ documents: [] });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.technicalDocument.deleteMany({ where: { projectId: id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
    }
}
