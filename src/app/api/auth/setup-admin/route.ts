import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple protection
    if (secret !== 'eeg-promo') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const email = 'antigravityadmin@eeg.be';
        const user = await prisma.user.update({
            where: { email },
            data: {
                role: 'ADMIN',
                status: 'APPROVED'
            }
        });

        return NextResponse.json({ success: true, message: `User ${email} promoted to ADMIN and APPROVED`, user });
    } catch (error) {
        console.error("Failed to promote user:", error);
        return NextResponse.json({ error: 'Failed to promote user', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
