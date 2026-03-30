import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        // Authenticate user
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
        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: 'Les nouveaux mots de passe ne correspondent pas' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Le mot de passe actuel est incorrect' }, { status: 401 });
        }

        // Hash new password and update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedNewPassword }
        });

        return NextResponse.json({ success: true, message: 'Mot de passe mis à jour avec succès' });

    } catch (err: unknown) {
        console.error("Change Password Error:", err);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
