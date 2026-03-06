import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-secret-key-12345';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: JWTPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(encodedSecret);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, encodedSecret);
        return payload;
    } catch {
        return null;
    }
}
