import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.headers.get('cookie')?.split('auth-token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token) as { role?: string } | null;
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const userId = resolvedParams.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                xp: true,
                level: true,
                characterId: true,
                createdAt: true,
                projectsAsPM: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        siteManager: { select: { id: true, name: true } },
                        tasks: { select: { quantity: true, completedQuantity: true, minutesPerUnit: true } },
                        weeklyPlans: { select: { isClosed: true, targetReached: true } },
                    }
                },
                projectsAsSM: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        projectManager: { select: { id: true, name: true } },
                        tasks: { select: { quantity: true, completedQuantity: true, minutesPerUnit: true } },
                        weeklyPlans: { select: { isClosed: true, targetReached: true } },
                    }
                },
                userBadges: {
                    select: {
                        earnedAt: true,
                        badge: { select: { name: true, icon: true, description: true } }
                    }
                }
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Compute stats for PM projects
        const pmProjects = user.projectsAsPM.map(p => {
            const budgetHours = p.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
            const earnedHours = p.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
            const pct = budgetHours > 0 ? Math.min(100, Math.round((earnedHours / budgetHours) * 100)) : 0;
            const closedPlans = p.weeklyPlans.filter(w => w.isClosed).length;
            const hitPlans = p.weeklyPlans.filter(w => w.isClosed && w.targetReached).length;
            return {
                id: p.id,
                name: p.name,
                location: p.location,
                sm: p.siteManager?.name || null,
                taskCount: p.tasks.length,
                budgetHours: Math.round(budgetHours),
                earnedHours: Math.round(earnedHours),
                pct,
                closedPlans,
                hitPlans,
            };
        });

        const smProjects = user.projectsAsSM.map(p => {
            const budgetHours = p.tasks.reduce((s, t) => s + (t.quantity * t.minutesPerUnit) / 60, 0);
            const earnedHours = p.tasks.reduce((s, t) => s + (t.completedQuantity * t.minutesPerUnit) / 60, 0);
            const pct = budgetHours > 0 ? Math.min(100, Math.round((earnedHours / budgetHours) * 100)) : 0;
            const closedPlans = p.weeklyPlans.filter(w => w.isClosed).length;
            const hitPlans = p.weeklyPlans.filter(w => w.isClosed && w.targetReached).length;
            return {
                id: p.id,
                name: p.name,
                location: p.location,
                pm: p.projectManager?.name || null,
                taskCount: p.tasks.length,
                budgetHours: Math.round(budgetHours),
                earnedHours: Math.round(earnedHours),
                pct,
                closedPlans,
                hitPlans,
            };
        });

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                xp: user.xp,
                level: user.level,
                characterId: user.characterId,
                createdAt: user.createdAt,
                badges: user.userBadges.map(ub => ({
                    name: ub.badge.name,
                    icon: ub.badge.icon,
                    description: ub.badge.description,
                    earnedAt: ub.earnedAt,
                })),
            },
            pmProjects,
            smProjects,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
