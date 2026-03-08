import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        // Delete blockage logs linked to daily task progress for this project
        await prisma.blockageLog.deleteMany({
            where: { dailyTaskProgress: { dailyReport: { projectId: id } } }
        });

        // Delete daily task progress for this project
        await prisma.dailyTaskProgress.deleteMany({
            where: { dailyReport: { projectId: id } }
        });

        // Delete attendance records for this project
        await prisma.attendance.deleteMany({
            where: { dailyReport: { projectId: id } }
        });

        // Delete daily reports for this project
        await prisma.dailyReport.deleteMany({
            where: { projectId: id }
        });

        await prisma.weeklyPlanTask.deleteMany({
            where: { weeklyPlan: { projectId: id } }
        });

        await prisma.weeklyPlan.deleteMany({
            where: { projectId: id }
        });

        await prisma.task.deleteMany({
            where: { projectId: id }
        });

        await prisma.project.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting project:", e);
        if (e instanceof Error) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}
