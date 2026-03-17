'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface RecipeDetail {
    ingredients: string[];
    steps: string[];
    tips: string;
}

interface RecipeInfo {
    id: number;
    name: string;
    emoji: string;
    time: string;
    difficulty: string;
    category: string;
    kcal: number;
    tags: string[];
    fodmap?: boolean;
}

interface RecipeDetailModalProps {
    recipe: RecipeInfo | null;
    onClose: () => void;
}

const CACHE_KEY = 'recipe-details-cache';

function getCache(): Record<number, RecipeDetail> {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function setCache(id: number, detail: RecipeDetail) {
    const cache = getCache();
    cache[id] = detail;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export default function RecipeDetailModal({ recipe, onClose }: RecipeDetailModalProps) {
    const [detail, setDetail] = useState<RecipeDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [closing, setClosing] = useState(false);

    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            onClose();
        }, 280);
    }, [onClose]);

    useEffect(() => {
        if (!recipe) {
            setDetail(null);
            return;
        }

        // Check cache first
        const cached = getCache()[recipe.id];
        if (cached) {
            setDetail(cached);
            return;
        }

        // Fetch from API
        setLoading(true);
        setError('');
        setDetail(null);

        fetch('/api/cooking/recipe-detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipeName: recipe.name,
                recipeCategory: recipe.category,
                recipeKcal: recipe.kcal,
                recipeTags: recipe.tags,
                recipeDifficulty: recipe.difficulty,
                recipeTime: recipe.time,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    const d: RecipeDetail = {
                        ingredients: data.ingredients || [],
                        steps: data.steps || [],
                        tips: data.tips || '',
                    };
                    setDetail(d);
                    setCache(recipe.id, d);
                }
            })
            .catch(() => setError('Erreur de connexion.'))
            .finally(() => setLoading(false));
    }, [recipe]);

    // Lock body scroll
    useEffect(() => {
        if (recipe) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [recipe]);

    if (!recipe) return null;

    const bgGradients = [
        ['#FFE5E5', '#FFDADA'], ['#E8F5E9', '#D5ECD6'], ['#EDE7F6', '#E0D4F5'],
        ['#FFF3E0', '#FFE8CC'], ['#FCE4EC', '#F9D0E0'], ['#E1F5FE', '#D0ECFA'],
        ['#FFF8E1', '#FFECB3'], ['#F3E5F5', '#E1BEE7'],
    ];
    const [bgFrom, bgTo] = bgGradients[recipe.id % bgGradients.length];

    return (
        <>
            <style jsx>{`
                @keyframes modal-backdrop-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modal-backdrop-out {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes modal-slide-up {
                    from { opacity: 0; transform: translateY(40px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes modal-slide-down {
                    from { opacity: 1; transform: translateY(0) scale(1); }
                    to { opacity: 0; transform: translateY(40px) scale(0.97); }
                }
                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                @keyframes stagger-in {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9990,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                    animation: closing ? 'modal-backdrop-out 0.28s ease-out forwards' : 'modal-backdrop-in 0.3s ease-out',
                }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '1.5rem',
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '85vh',
                        overflow: 'auto',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                        animation: closing ? 'modal-slide-down 0.28s ease-out forwards' : 'modal-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Header / Hero */}
                    <div style={{
                        background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})`,
                        padding: '2.5rem 2rem 2rem',
                        position: 'relative',
                        borderRadius: '1.5rem 1.5rem 0 0',
                    }}>
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.7)', border: 'none',
                                cursor: 'pointer', fontSize: '1.1rem', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            ✕
                        </button>
                        <div style={{ fontSize: '4rem', marginBottom: '0.75rem', lineHeight: 1 }}>{recipe.emoji}</div>
                        <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>{recipe.name}</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)' }}>
                            <span>⏱ {recipe.time}</span>
                            <span>📊 {recipe.difficulty}</span>
                            <span style={{ fontWeight: 700, color: 'var(--ck-orange)' }}>🔥 {recipe.kcal} kcal</span>
                            <span style={{ opacity: 0.6 }}>{recipe.category}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {recipe.fodmap && (
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                    background: 'rgba(124,185,139,0.2)', color: '#2d7a4a',
                                }}>🥦 FODMAP-safe</span>
                            )}
                            {recipe.tags.slice(0, 4).map(tag => (
                                <span key={tag} style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600,
                                    background: 'rgba(196,167,231,0.2)', color: '#6b4fa0',
                                }}>{tag}</span>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.5rem 2rem 2rem' }}>
                        {loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{
                                        width: '140px', height: '14px', borderRadius: '7px',
                                        background: 'rgba(0,0,0,0.06)', marginBottom: '0.75rem',
                                        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                                    }} />
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} style={{
                                            width: `${85 - i * 8}%`, height: '12px', borderRadius: '6px',
                                            background: 'rgba(0,0,0,0.04)', marginBottom: '0.5rem',
                                            animation: `skeleton-pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                                        }} />
                                    ))}
                                </div>
                                <div>
                                    <div style={{
                                        width: '100px', height: '14px', borderRadius: '7px',
                                        background: 'rgba(0,0,0,0.06)', marginBottom: '0.75rem',
                                        animation: 'skeleton-pulse 1.5s ease-in-out 0.3s infinite',
                                    }} />
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{
                                            width: `${90 - i * 5}%`, height: '12px', borderRadius: '6px',
                                            background: 'rgba(0,0,0,0.04)', marginBottom: '0.5rem',
                                            animation: `skeleton-pulse 1.5s ease-in-out ${0.3 + i * 0.15}s infinite`,
                                        }} />
                                    ))}
                                </div>
                                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--ck-text-muted)', fontWeight: 600 }}>
                                    ✨ Gemini génère les détails…
                                </p>
                            </div>
                        )}

                        {error && (
                            <div style={{
                                padding: '1rem', borderRadius: '1rem',
                                background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)',
                                color: 'var(--ck-coral)', fontWeight: 600, fontSize: '0.9rem',
                            }}>
                                ❌ {error}
                            </div>
                        )}

                        {detail && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Ingredients */}
                                <div style={{ animation: 'stagger-in 0.4s ease-out' }}>
                                    <h4 style={{
                                        fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.05em', color: 'var(--ck-orange)', marginBottom: '0.75rem',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    }}>
                                        🧂 Ingrédients
                                    </h4>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                        gap: '0.4rem',
                                    }}>
                                        {detail.ingredients.map((ing, j) => (
                                            <div key={j} style={{
                                                fontSize: '0.88rem', padding: '0.4rem 0.75rem',
                                                borderLeft: '3px solid var(--ck-peach)',
                                                background: 'rgba(245,138,61,0.03)',
                                                borderRadius: '0 0.5rem 0.5rem 0',
                                                animation: `stagger-in 0.4s ease-out ${j * 0.05}s both`,
                                            }}>
                                                {ing}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div style={{ animation: 'stagger-in 0.4s ease-out 0.15s both' }}>
                                    <h4 style={{
                                        fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.05em', color: 'var(--ck-sage-deep)', marginBottom: '0.75rem',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    }}>
                                        👩‍🍳 Étapes
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {detail.steps.map((step, j) => (
                                            <div key={j} style={{
                                                display: 'flex', gap: '0.75rem', fontSize: '0.88rem',
                                                animation: `stagger-in 0.4s ease-out ${0.15 + j * 0.06}s both`,
                                            }}>
                                                <span style={{
                                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                                    background: 'linear-gradient(135deg, var(--ck-sage), var(--ck-teal))',
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: 800,
                                                }}>
                                                    {j + 1}
                                                </span>
                                                <span style={{ lineHeight: 1.5, paddingTop: '0.15rem' }}>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tips */}
                                {detail.tips && (
                                    <div style={{
                                        padding: '1rem 1.25rem', borderRadius: '1rem',
                                        background: 'linear-gradient(135deg, rgba(196,167,231,0.08), rgba(196,167,231,0.03))',
                                        border: '1px solid rgba(196,167,231,0.15)',
                                        fontSize: '0.88rem', color: 'var(--ck-lavender-deep)',
                                        lineHeight: 1.5,
                                        animation: 'stagger-in 0.4s ease-out 0.3s both',
                                    }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            💡 Astuce du Chef
                                        </span>
                                        <p style={{ margin: '0.4rem 0 0' }}>{detail.tips}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
