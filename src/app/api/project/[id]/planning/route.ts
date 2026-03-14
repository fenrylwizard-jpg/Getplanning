import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const milestones = await prisma.planningMilestone.findMany({
            where: { projectId: id },
            orderBy: { sortOrder: "asc" },
        });
        return NextResponse.json({ milestones });
    } catch {
        return NextResponse.json({ milestones: [] });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.planningMilestone.deleteMany({ where: { projectId: id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
    }
}
