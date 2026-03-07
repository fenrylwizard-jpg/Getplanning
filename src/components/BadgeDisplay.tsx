"use client";
import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Sparkles } from 'lucide-react';

interface BadgeData {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    earned: boolean;
    earnedAt: string | null;
}

interface BadgeDisplayProps {
    userId: string;
    compact?: boolean;
}

export default function BadgeDisplay({ userId, compact = false }: BadgeDisplayProps) {
    const [badges, setBadges] = useState<BadgeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        async function fetchBadges() {
            try {
                const res = await fetch(`/api/badges?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBadges(data.badges || []);
                }
            } catch (e) {
                console.error('Failed to fetch badges:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchBadges();
    }, [userId]);

    if (loading) return null;
    
    const earned = badges.filter(b => b.earned);
    const locked = badges.filter(b => !b.earned);
    const displayBadges = compact && !showAll ? earned.slice(0, 4) : (showAll ? badges : earned);

    if (compact && earned.length === 0) return null;

    return (
        <div className="space-y-4">
            {!compact && (
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Trophy size={18} className="text-amber-400" />
                    Badges ({earned.length}/{badges.length})
                </h3>
            )}

            <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'} gap-3`}>
                {displayBadges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} compact={compact} />
                ))}
            </div>

            {compact && earned.length > 4 && !showAll && (
                <button 
                    onClick={() => setShowAll(true)}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                    +{earned.length - 4} autres badges
                </button>
            )}

            {!compact && locked.length > 0 && (
                <>
                    <h4 className="text-sm text-gray-500 mt-6 flex items-center gap-2">
                        <Lock size={14} /> Non débloqués ({locked.length})
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {locked.map(badge => (
                            <BadgeCard key={badge.id} badge={badge} compact={false} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function BadgeCard({ badge, compact }: { badge: BadgeData; compact: boolean }) {
    return (
        <div 
            className={`relative rounded-2xl border transition-all duration-300 text-center group
                ${badge.earned 
                    ? 'bg-gradient-to-b from-amber-500/10 to-purple-500/5 border-amber-500/20 hover:border-amber-400/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                    : 'bg-white/[0.02] border-white/5 opacity-40 grayscale'
                }
                ${compact ? 'p-2' : 'p-4'}
            `}
            title={`${badge.name}: ${badge.description}${badge.earnedAt ? ` — Obtenu le ${new Date(badge.earnedAt).toLocaleDateString('fr-FR')}` : ''}`}
        >
            {badge.earned && (
                <Sparkles size={12} className="absolute top-1 right-1 text-amber-400 animate-pulse" />
            )}
            <div className={compact ? 'text-xl' : 'text-3xl mb-2'}>{badge.icon}</div>
            {!compact && (
                <>
                    <div className="text-xs font-bold text-white/80 line-clamp-1">{badge.name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">{badge.description}</div>
                </>
            )}
        </div>
    );
}
