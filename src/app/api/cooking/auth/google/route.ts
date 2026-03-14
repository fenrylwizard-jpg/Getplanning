import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth'; // Existing the worksite-tracker JWT logic

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
    try {
        const { token, isMock } = await req.json();

        let email = '';
        let name = '';

        if (isMock && process.env.NODE_ENV === 'development') {
            // Local fallback for testing without Google setup
            email = 'dev@cooking.local';
            name = 'Chef Dev';
        } else {
            // Real verification
            if (!process.env.GOOGLE_CLIENT_ID) {
                return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });
            }

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload?.email) {
                return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
            }

            email = payload.email;
            name = payload.name || 'Chef';
        }

        // Upsert user in database
        const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: {
                email,
                name,
                passwordHash: 'oauth-not-applicable',
                role: 'USER', // Cooking app standard users can be 'USER', or maybe keep 'SM' if required by enum
                status: 'APPROVED',
            },
        });

        const jwtToken = await signToken({
            id: user.id,
            email: user.email,
            role: user.role, // "USER"
        });

        const response = NextResponse.json({ success: true, user });

        response.cookies.set({
            name: 'auth-token',
            value: jwtToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;

    } catch (error) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
