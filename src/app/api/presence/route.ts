import { NextResponse } from 'next/server';
import {
    setPresence,
    removePresence,
    getPresence,
    addSSEConnection,
    removeSSEConnection,
} from '@/lib/presence-store';

/**
 * GET /api/presence?projectId=xxx&userId=xxx
 * Opens an SSE connection for real-time presence updates.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const stream = new ReadableStream({
        start(controller) {
            addSSEConnection(projectId, controller);

            // Send initial presence data
            const data = JSON.stringify(getPresence(projectId));
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));

            // Cleanup on close
            req.signal.addEventListener('abort', () => {
                removeSSEConnection(projectId, controller);
            });
        },
        cancel() {
            // Connection closed by client
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

/**
 * POST /api/presence — Heartbeat / join
 * Body: { projectId, userId, userName, role, characterId }
 */
export async function POST(req: Request) {
    try {
        const { projectId, userId, userName, role, characterId } = await req.json();

        if (!projectId || !userId) {
            return NextResponse.json({ error: 'projectId and userId required' }, { status: 400 });
        }

        setPresence(projectId, {
            userId,
            userName: userName || 'Unknown',
            role: role || 'SM',
            characterId: characterId || 1,
            lastSeen: Date.now(),
        });

        return NextResponse.json({ success: true, presence: getPresence(projectId) });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

/**
 * DELETE /api/presence — Leave
 * Body: { projectId, userId }
 */
export async function DELETE(req: Request) {
    try {
        const { projectId, userId } = await req.json();
        if (projectId && userId) {
            removePresence(projectId, userId);
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
