"use client";

import React from "react";
import Image from "next/image";

interface AvatarDisplayProps {
    characterId: number; // 1: Mason, 2: Electrician, 3: Carpenter, 4: Plumber, 5: Foreman
    level: number;
    size?: number;
    className?: string;
    showLevel?: boolean;
}

const ROLE_MAP: Record<number, string> = {
    1: "mason",
    2: "electrician",
    3: "carpenter",
    4: "plumber",
    5: "foreman"
};

export default function AvatarDisplay({ characterId, level, size = 120, className = "", showLevel = true }: AvatarDisplayProps) {
    // Determine tier based on level
    let tier = 0; // 0: Apprentice, 1: Skilled, 2: Expert, 3: Master, 4: Grand Master, 5: Legend
    if (level >= 50) tier = 5;
    else if (level >= 40) tier = 4;
    else if (level >= 30) tier = 3;
    else if (level >= 20) tier = 2;
    else if (level >= 10) tier = 1;

    const role = ROLE_MAP[characterId] || "mason";
    const imageUrl = `/characters/${role}_t${tier}.png`;

    return (
        <div
            className={`relative ${className}`}
            style={{ width: size, height: size }}
        >
            <Image 
                src={imageUrl} 
                alt={`${role} Tier ${tier + 1}`}
                fill
                unoptimized
                className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ck-avatar-transparent"
            />
            
            {/* Level Badge — only show if showLevel is true and size is large enough */}
            {showLevel && size >= 60 && (
                <div className="absolute bottom-0 right-0 px-1.5 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-sm text-[10px] font-black text-white border border-purple-400/50">
                    LVL {level}
                </div>
            )}

            {/* Glowing Aura for high tiers */}
            {tier >= 2 && size >= 60 && (
                <div className="absolute inset-0 pointer-events-none rounded-full bg-gradient-to-t from-purple-500/15 to-transparent animate-pulse" />
            )}
        </div>
    );
}
