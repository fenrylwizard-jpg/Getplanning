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
        const result = await prisma.user.updateMany({
            where: { name: 'Admin Antigravity' },
            data: {
                role: 'ADMIN',
                status: 'APPROVED'
            }
        });

        return NextResponse.json({ success: true, message: `Promoted Admin Antigravity`, result });
    } catch (error) {
        console.error("Failed to promote user:", error);
        return NextResponse.json({ error: 'Failed to promote user', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
