import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Public routes that don't need protection
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/characters') ||
        pathname.startsWith('/api/presence') ||
        pathname === '/'
    ) {
        return NextResponse.next();
    }

    // Exempt authentication and seed routes from JWT check
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/seed') || pathname.startsWith('/api/cron')) {
        return NextResponse.next();
    }

    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyToken(token) as { id?: string; email?: string; role?: string; iat?: number } | null;

    if (!payload) {
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('auth-token');
        return response;
    }

    const role = payload.role;

    // Role-based route protection
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (pathname.startsWith('/pm') && role !== 'PM' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (pathname.startsWith('/sm') && role !== 'SM' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Inject user info into request headers for downstream API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id || '');
    response.headers.set('x-user-email', payload.email || '');
    response.headers.set('x-user-role', payload.role || '');

    // Token refresh: if token is older than 12h, issue a fresh one
    if (payload.iat) {
        const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;
        if (tokenAge > 12 * 60 * 60) {
            const newToken = await signToken({
                id: payload.id,
                email: payload.email,
                role: payload.role,
            });
            response.cookies.set({
                name: 'auth-token',
                value: newToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24,
            });
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!public|_next/static|_next/image|favicon.ico).*)'],
};
