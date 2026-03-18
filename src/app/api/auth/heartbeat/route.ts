import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');
        
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = await verifyToken(token.value);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const userId = decoded.id as string;

        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        // Silently fail heartbeat to avoid console spam
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}
