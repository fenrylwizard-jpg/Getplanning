import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        route: '/api/cooking/debug',
        timestamp: new Date().toISOString(),
        message: 'Cooking API reachable - middleware passed through'
    });
}
