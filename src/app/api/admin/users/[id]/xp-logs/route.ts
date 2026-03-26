import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = req.headers.get('cookie')?.split('auth-token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token) as { role?: string } | null;
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: userId } = await params;

        // Fetch user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, xp: true, level: true, characterId: true }
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch all XP logs for this user
        const logs = await prisma.xpLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amount: true,
                source: true,
                breakdown: true,
                projectId: true,
                projectName: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ user, logs });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
