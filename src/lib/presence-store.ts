/**
 * In-memory presence store for tracking which users are viewing which projects.
 * In production with multiple instances, this would need Redis or similar.
 * For a single Dokploy instance, in-memory is sufficient.
 */

interface PresenceEntry {
    userId: string;
    userName: string;
    role: string;
    characterId: number;
    lastSeen: number; // timestamp
}

// Map of projectId → Map of userId → PresenceEntry
const presenceMap = new Map<string, Map<string, PresenceEntry>>();

// SSE connections: Map of projectId → Set of ReadableStreamController
const sseConnections = new Map<string, Set<ReadableStreamDefaultController>>();

const PRESENCE_TIMEOUT_MS = 30_000; // 30 seconds

export function setPresence(projectId: string, entry: PresenceEntry) {
    if (!presenceMap.has(projectId)) {
        presenceMap.set(projectId, new Map());
    }
    presenceMap.get(projectId)!.set(entry.userId, { ...entry, lastSeen: Date.now() });
    broadcastPresence(projectId);
}

export function removePresence(projectId: string, userId: string) {
    presenceMap.get(projectId)?.delete(userId);
    broadcastPresence(projectId);
}

export function getPresence(projectId: string): PresenceEntry[] {
    const project = presenceMap.get(projectId);
    if (!project) return [];

    const now = Date.now();
    const active: PresenceEntry[] = [];

    for (const [userId, entry] of project) {
        if (now - entry.lastSeen > PRESENCE_TIMEOUT_MS) {
            project.delete(userId);
        } else {
            active.push(entry);
        }
    }

    return active;
}

export function addSSEConnection(projectId: string, controller: ReadableStreamDefaultController) {
    if (!sseConnections.has(projectId)) {
        sseConnections.set(projectId, new Set());
    }
    sseConnections.get(projectId)!.add(controller);
}

export function removeSSEConnection(projectId: string, controller: ReadableStreamDefaultController) {
    sseConnections.get(projectId)?.delete(controller);
}

function broadcastPresence(projectId: string) {
    const connections = sseConnections.get(projectId);
    if (!connections) return;

    const data = JSON.stringify(getPresence(projectId));
    const message = `data: ${data}\n\n`;
    const encoder = new TextEncoder();

    for (const controller of connections) {
        try {
            controller.enqueue(encoder.encode(message));
        } catch {
            connections.delete(controller);
        }
    }
}
