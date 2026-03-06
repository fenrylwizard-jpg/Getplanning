import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password, role } = await req.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Cette adresse e-mail est déjà utilisée' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Created with default status = "PENDING" automatically by prisma schema
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role
            }
        });

        return NextResponse.json({ success: true, message: 'Compte créé et en attente d\'approbation' });

    } catch (err) {
        console.error("Register Error:", err);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
