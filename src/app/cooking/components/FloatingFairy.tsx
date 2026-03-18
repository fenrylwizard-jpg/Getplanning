'use client';

import React from 'react';
import Image from 'next/image';
import { useCookingAuth } from '../CookingAuthContext';

export function getFairyLevel(xp: number): number {
    let level = 1;
    let xpConsumed = 0;
    
    while (true) {
        let cost = 0;
        if (level <= 10) {
            cost = level * 500;
        } else {
            cost = 5000 + (level - 10) * 2000;
        }
        
        if (xpConsumed + cost > xp) break;
        xpConsumed += cost;
        level++;
    }
    return level;
}

export function getFairyTier(level: number): number {
    if (level < 11) return 1;
    if (level < 31) return 2;
    return 3;
}

export function getXpForNextLevel(level: number): number {
    if (level <= 10) return level * 500;
    return 5000 + (level - 10) * 2000;
}

export default function FloatingFairy() {
    const { user } = useCookingAuth();
    
    if (!user || (!user.selectedFairy && typeof user.fairyXp === 'undefined')) {
        return null;
    }

    const type = user.selectedFairy || 'nature';
    const xp = user.fairyXp ?? 0;
    
    const level = getFairyLevel(xp);
    const tier = getFairyTier(level);
    
    // Calculate progress to next level
    let currentLevelBaseXp = 0;
    for (let i = 1; i < level; i++) {
        currentLevelBaseXp += getXpForNextLevel(i);
    }
    
    const xpIntoLevel = xp - currentLevelBaseXp;
    const xpNeeded = getXpForNextLevel(level);
    const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100));

    // Map UI colors based on element
    const colorMap = {
        fire: { aura: 'from-orange-500/30', border: 'border-orange-400', barBg: 'bg-orange-200', barFill: 'bg-orange-500' },
        water: { aura: 'from-blue-500/40', border: 'border-blue-400', barBg: 'bg-blue-200', barFill: 'bg-blue-500' },
        nature: { aura: 'from-emerald-500/30', border: 'border-emerald-400', barBg: 'bg-emerald-200', barFill: 'bg-emerald-500' }
    };
    
    const colors = colorMap[type];

    return (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-center group pointer-events-auto md:bottom-6 md:right-6">
            
            {/* XP Tooltip / Bar appearing on hover */}
            <div className="absolute bottom-[100%] mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-48 bg-white/90 backdrop-blur-md px-3 py-2 rounded-md shadow-lg border border-slate-200 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">
                    {type} Fairy • Lvl {level}
                </span>
                <div className={`w-full h-2 rounded-full ${colors.barBg}`}>
                    <div 
                        className={`h-full rounded-full ${colors.barFill} transition-all duration-500 ease-out`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="w-full flex justify-between mt-1 text-[9px] text-slate-400 font-medium">
                    <span>{xpIntoLevel}</span>
                    <span>{xpNeeded} XP</span>
                </div>
            </div>

            {/* Glowing Aura for tier 2/3 */}
            {tier > 1 && (
                <div className={`absolute inset-y-0 w-[150%] left-[-25%] pointer-events-none rounded-full bg-gradient-to-t ${colors.aura} to-transparent animate-pulse -z-10 blur-xl`} />
            )}

            {/* The Fairy Sprite */}
            <div className="relative w-24 h-24 hover:-translate-y-2 transition-transform duration-300 cursor-help">
                <Image
                    src={`/cooking/fairies/${type}_fairy_${tier}.png`}
                    alt={`${type} fairy level ${level}`}
                    fill
                    unoptimized // Required for external images or local if config restrict
                    className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] animate-bounce-slow"
                />
            </div>
            
        </div>
    );
}
