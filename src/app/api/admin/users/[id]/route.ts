import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.headers.get('cookie')?.split('auth-token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token) as { role?: string; userId?: string } | null;
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const userId = resolvedParams.id;

        // Prevent self-deletion
        if (payload.userId === userId) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        // Check user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete user-related data in correct order

        // 1. Delete cooking app data
        await prisma.mealPrep.deleteMany({ where: { userId } });
        await prisma.pantryItem.deleteMany({ where: { userId } });
        await prisma.cookingProtocol.deleteMany({ where: { userId } });

        // 2. Delete badges
        await prisma.userBadge.deleteMany({ where: { userId } });

        // 3. Delete plan templates created by user
        await prisma.planTemplate.deleteMany({ where: { createdById: userId } });

        // 4. For projects where this user is PM or SM:
        //    First, get all projects managed by this user
        const pmProjects = await prisma.project.findMany({ where: { projectManagerId: userId }, select: { id: true } });
        const smProjects = await prisma.project.findMany({ where: { siteManagerId: userId }, select: { id: true } });

        // Delete all PM projects with full cascade (same as project delete API)
        for (const project of pmProjects) {
            await prisma.blockageLog.deleteMany({ where: { dailyTaskProgress: { dailyReport: { projectId: project.id } } } });
            await prisma.dailyTaskProgress.deleteMany({ where: { dailyReport: { projectId: project.id } } });
            await prisma.attendance.deleteMany({ where: { dailyReport: { projectId: project.id } } });
            await prisma.dailyReport.deleteMany({ where: { projectId: project.id } });
            await prisma.weeklyPlanTask.deleteMany({ where: { weeklyPlan: { projectId: project.id } } });
            await prisma.weeklyPlan.deleteMany({ where: { projectId: project.id } });
            await prisma.task.deleteMany({ where: { projectId: project.id } });
            await prisma.project.delete({ where: { id: project.id } });
        }

        // Nullify SM reference for projects where user is site manager
        for (const project of smProjects) {
            // Only update if project still exists (wasn't already deleted above as PM project)
            try {
                await prisma.project.update({
                    where: { id: project.id },
                    data: { siteManagerId: null }
                });
            } catch {
                // Project may have been deleted in PM cascade above
            }
        }

        // 5. Finally delete the user
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting user:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
