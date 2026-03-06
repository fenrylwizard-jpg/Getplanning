import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.headers.get('cookie')?.split('auth-token=')[1]?.split(';')[0];
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token) as { role?: string } | null;
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const userId = resolvedParams.id;
        
        const { action } = await req.json(); // "APPROVE" or "REJECT"

        if (action !== 'APPROVE' && action !== 'REJECT') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus }
        });

        return NextResponse.json({ success: true, status: updatedUser.status });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
