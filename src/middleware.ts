import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const hostname = req.headers.get('host') || '';


    // ── Subdomain routing ──
    // Strip port for local dev
    const host = hostname.split(':')[0];
    const parts = host.split('.');
    // Detect subdomain: e.g. "app.getplanning.org" → subdomain = "app"
    // For localhost, there's no subdomain
    const isSubdomain = parts.length > 2 || (parts.length === 2 && !['localhost', 'co', 'com', 'org', 'net', 'io'].includes(parts[1]));
    const subdomain = isSubdomain ? parts[0] : null;

    // ── Presentation subdomain → serve static HTML ──
    if (subdomain === 'presentation') {
        const url = req.nextUrl.clone();
        // Serve the requested presentation file, default to French
        if (pathname === '/presentation-en.html') {
            url.pathname = '/presentation-en.html';
        } else if (pathname === '/presentation-nl.html') {
            url.pathname = '/presentation-nl.html';
        } else {
            url.pathname = '/presentation.html';
        }
        return NextResponse.rewrite(url);
    }

    // ── Cooking subdomain → serve cooking app ──
    if (subdomain === 'cooking') {
        if (!pathname.startsWith('/cooking')) {
            return NextResponse.rewrite(new URL(`/cooking${pathname === '/' ? '' : pathname}`, req.url));
        }
    }

    // ── Root domain (no subdomain) → serve personal landing page ──
    // Only redirect if it's the root domain AND the path is "/"
    if (!subdomain && pathname === '/' && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        const url = req.nextUrl.clone();
        url.pathname = '/landing';
        return NextResponse.rewrite(url);
    }

    // ── App subdomain OR localhost → normal app behavior ──

    // Public routes that don't need protection
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/characters') ||
        pathname.startsWith('/api/presence') ||
        pathname.startsWith('/landing') ||
        pathname.startsWith('/presentation') ||
        pathname.startsWith('/cooking') ||
        pathname === '/'
    ) {
        return NextResponse.next();
    }

    // Exempt authentication and seed routes from JWT check
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/seed') || pathname.startsWith('/api/cron') || pathname.startsWith('/api/cooking')) {
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
