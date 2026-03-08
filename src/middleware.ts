import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Public routes that don't need protection
    if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/characters') || pathname === '/') {
        return NextResponse.next();
    }

    // Exempt authentication and seed routes from JWT check
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/seed')) {
        return NextResponse.next();
    }

    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const payload = await verifyToken(token) as { role?: string } | null;

    if (!payload) {
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('auth-token');
        return response;
    }

    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!public|_next/static|_next/image|favicon.ico).*)'],
};
