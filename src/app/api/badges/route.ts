import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List badges for a user
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json({ error: 'userId requis' }, { status: 400 });
        }

        // Get all badge definitions and user's earned badges
        const [allBadges, userBadges] = await Promise.all([
            prisma.badge.findMany({ orderBy: { category: 'asc' } }),
            prisma.userBadge.findMany({ 
                where: { userId },
                include: { badge: true }
            })
        ]);

        const earnedCodes = new Set(userBadges.map(ub => ub.badge.code));

        const badges = allBadges.map(b => ({
            ...b,
            earned: earnedCodes.has(b.code),
            earnedAt: userBadges.find(ub => ub.badge.code === b.code)?.earnedAt || null,
        }));

        return NextResponse.json({ badges });
    } catch (err) {
        console.error('Error fetching badges:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
