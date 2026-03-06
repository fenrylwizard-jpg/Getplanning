"use client";

import React from "react";
import Image from "next/image";

interface AvatarDisplayProps {
    characterId: number; // 1: Mason, 2: Electrician, 3: Carpenter, 4: Plumber, 5: Foreman
    level: number;
    size?: number;
    className?: string;
}

const ROLE_MAP: Record<number, string> = {
    1: "mason",
    2: "electrician",
    3: "carpenter",
    4: "plumber",
    5: "foreman"
};

export default function AvatarDisplay({ characterId, level, size = 120, className = "" }: AvatarDisplayProps) {
    // Determine tier based on level
    let tier = 0; // 0: Apprentice, 1: Skilled, 2: Expert, 3: Master, 4: Grand Master, 5: Legend
    if (level >= 50) tier = 5;
    else if (level >= 40) tier = 4;
    else if (level >= 30) tier = 3;
    else if (level >= 20) tier = 2;
    else if (level >= 10) tier = 1;

    const role = ROLE_MAP[characterId] || "mason";
    
    // We are generating all assets now, so no fallback needed
    const imageUrl = `/characters/${role}_t${tier}.png`;

    const sizeClasses: Record<number, string> = {
        100: "w-[100px] h-[100px]",
        120: "w-[120px] h-[120px]"
    };
    const sizeClass = sizeClasses[size] || "w-[120px] h-[120px]";

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] shadow-2xl ${sizeClass} ${className}`}>
            <div className="absolute inset-0 p-1">
                <Image 
                    src={imageUrl} 
                    alt={`${role} Tier ${tier + 1}`}
                    fill
                    unoptimized
                    className="object-contain p-2"
                />
            </div>
            
            {/* Level Badge */}
            <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-md bg-purple-600/80 backdrop-blur-sm text-[10px] font-black text-white border border-purple-400/50">
                LVL {level}
            </div>

            {/* Glowing Aura for high tiers */}
            {tier >= 2 && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-purple-500/20 to-transparent animate-pulse" />
            )}
        </div>
    );
}
