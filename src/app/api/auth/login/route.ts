import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const userStatus = (user as { status?: string }).status;

        if (userStatus === 'PENDING') {
            return NextResponse.json({ error: 'Votre compte est en attente d\'approbation par un administrateur' }, { status: 403 });
        }

        if (userStatus === 'REJECTED') {
            return NextResponse.json({ error: 'Votre demande d\'accès a été refusée' }, { status: 403 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        const response = NextResponse.json({ success: true, role: user.role });
        
        // Log the login activity
        await logActivity(user.id, 'LOGIN', 'Connexion réussie');

        // Set the secure HTTP-Only cookie
        response.cookies.set({
            name: 'auth-token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;

    } catch (err: unknown) {
        console.error("Login Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
