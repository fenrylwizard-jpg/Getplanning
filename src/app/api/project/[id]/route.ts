import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-auth-user";

const ADMIN_EMAIL = 'admin@eeg.be';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const { id } = await params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                projectManager: { select: { id: true, name: true, email: true } },
                siteManager: { select: { id: true, name: true, email: true } },
                subLocations: true
            }
        });
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Also return lists of PMs and SMs for the dropdowns
        const [pms, sms] = await Promise.all([
            prisma.user.findMany({ where: { role: 'PM', status: 'APPROVED' }, select: { id: true, name: true, email: true } }),
            prisma.user.findMany({ where: { role: 'SM', status: 'APPROVED' }, select: { id: true, name: true, email: true } })
        ]);
        return NextResponse.json({ project, pms, sms });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const { id } = await params;
        const body = await req.json();
        const { name, location, startDate, endDate, projectManagerId, siteManagerId, subLocations } = body;

        const updated = await prisma.project.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(location !== undefined && { location: location || null }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(projectManagerId !== undefined && { projectManagerId }),
                ...(siteManagerId !== undefined && { siteManagerId: siteManagerId || null }),
            }
        });

        // Sync subLocations if provided
        if (subLocations !== undefined) {
            await prisma.subLocation.deleteMany({ where: { projectId: id } });
            if (subLocations.length > 0) {
                await prisma.subLocation.createMany({
                    data: subLocations.map((name: string) => ({ name, projectId: id }))
                });
            }
        }

        return NextResponse.json({ success: true, project: updated });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

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
