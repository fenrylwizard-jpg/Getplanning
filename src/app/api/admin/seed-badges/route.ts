import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BADGE_DEFINITIONS } from '@/lib/badge-definitions';

/**
 * POST: Seed badge definitions into the database (idempotent)
 * Called on first deploy or when new badges are added
 */
export async function POST() {
    try {
        let created = 0;
        for (const def of BADGE_DEFINITIONS) {
            const existing = await prisma.badge.findUnique({ where: { code: def.code } });
            if (!existing) {
                await prisma.badge.create({ data: def });
                created++;
            }
        }
        return NextResponse.json({ success: true, created, total: BADGE_DEFINITIONS.length });
    } catch (e) {
        console.error('Badge seed error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/**
 * GET: Check badge seed status
 */
export async function GET() {
    try {
        const count = await prisma.badge.count();
        return NextResponse.json({ seeded: count, expected: BADGE_DEFINITIONS.length, needsSeed: count < BADGE_DEFINITIONS.length });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
