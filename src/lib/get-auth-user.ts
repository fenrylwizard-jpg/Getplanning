import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export interface AuthUser {
    id: string;
    email: string;
    role: 'PM' | 'SM' | 'ADMIN';
}

/**
 * Reusable server-side helper to extract the authenticated user from the auth cookie.
 * Use in API routes and Server Components.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;

    const payload = await verifyToken(token) as { id?: string; email?: string; role?: string } | null;
    if (!payload || !payload.id || !payload.email || !payload.role) return null;

    return {
        id: payload.id,
        email: payload.email,
        role: payload.role as 'PM' | 'SM' | 'ADMIN',
    };
}
