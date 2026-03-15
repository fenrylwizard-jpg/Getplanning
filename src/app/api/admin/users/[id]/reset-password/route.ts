import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(
    req: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { newPassword } = await req.json();

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 6 caractères' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Mot de passe réinitialisé pour ${user.name || user.email}` 
        });

    } catch (err) {
        console.error("Admin Reset Password Error:", err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
