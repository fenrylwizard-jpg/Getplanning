"use client";

import { useEffect, useState, useRef } from "react";

interface PresenceUser {
    userId: string;
    userName: string;
    role: string;
    characterId: number;
}

export default function PresenceIndicator({
    projectId,
    currentUserId,
    currentUserName,
    currentUserRole,
    currentCharacterId,
}: {
    projectId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserRole: string;
    currentCharacterId: number;
}) {
    const [viewers, setViewers] = useState<PresenceUser[]>([]);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Connect to SSE stream
        const eventSource = new EventSource(`/api/presence?projectId=${projectId}`);

        eventSource.onmessage = (event) => {
            try {
                const data: PresenceUser[] = JSON.parse(event.data);
                // Filter out current user
                setViewers(data.filter((u) => u.userId !== currentUserId));
            } catch {
                // ignore parse errors
            }
        };

        // Send heartbeat every 15 seconds
        const sendHeartbeat = () => {
            fetch("/api/presence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    userId: currentUserId,
                    userName: currentUserName,
                    role: currentUserRole,
                    characterId: currentCharacterId,
                }),
            }).catch(() => {});
        };

        // Initial heartbeat
        sendHeartbeat();
        heartbeatRef.current = setInterval(sendHeartbeat, 15000);

        // Cleanup on unmount
        return () => {
            eventSource.close();
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);

            // Notify server we're leaving
            fetch("/api/presence", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, userId: currentUserId }),
            }).catch(() => {});
        };
    }, [projectId, currentUserId, currentUserName, currentUserRole, currentCharacterId]);

    if (viewers.length === 0) return null;

    const roleColors: Record<string, string> = {
        PM: "#a78bfa",
        SM: "#34d399",
        ADMIN: "#f59e0b",
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex -space-x-2">
                {viewers.slice(0, 5).map((v) => (
                    <div
                        key={v.userId}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{
                            borderColor: roleColors[v.role] || "#6b7280",
                            background: "rgba(0,0,0,0.4)",
                            color: roleColors[v.role] || "#9ca3af",
                        }}
                        title={`${v.userName} (${v.role})`}
                    >
                        {v.userName.charAt(0).toUpperCase()}
                    </div>
                ))}
            </div>
            <span className="text-xs text-gray-400">
                {viewers.length === 1
                    ? `${viewers[0].userName} consulte aussi`
                    : `${viewers.length} personnes en ligne`}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
    );
}
