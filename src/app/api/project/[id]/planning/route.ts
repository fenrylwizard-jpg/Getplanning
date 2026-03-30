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

/**
 * PATCH /api/project/[id]/planning
 * Bulk update milestone progress values.
 * Body: { updates: [{ sortOrder: number, progress: number }] }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const updates: { sortOrder: number; progress: number }[] = body.updates;

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "updates array required" }, { status: 400 });
        }

        // Batch update using transactions
        await prisma.$transaction(
            updates.map(u =>
                prisma.planningMilestone.updateMany({
                    where: { projectId: id, sortOrder: u.sortOrder },
                    data: { progress: u.progress, isComplete: u.progress >= 1 },
                })
            )
        );

        return NextResponse.json({ success: true, count: updates.length });
    } catch (err) {
        console.error("Planning progress update error:", err);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}

