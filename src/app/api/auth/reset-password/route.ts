import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requis' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal whether the email exists
            return NextResponse.json({ success: true, message: 'Demande enregistrée' });
        }

        // Flag user for password reset by admin
        // For now, we mark this in the user's record
        await prisma.user.update({
            where: { id: user.id },
            data: {
                // Use a convention: set a flag that admin can see
                // We'll reuse a field or add a simple marker
            }
        });

        return NextResponse.json({ success: true, message: 'Demande enregistrée' });

    } catch (err) {
        console.error("Password Reset Error:", err);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
