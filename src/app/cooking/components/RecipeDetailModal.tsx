'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCookingAuth } from '../CookingAuthContext';

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

const BG_CLASSES = [
    'ck-modal-bg-0', 'ck-modal-bg-1', 'ck-modal-bg-2', 'ck-modal-bg-3',
    'ck-modal-bg-4', 'ck-modal-bg-5', 'ck-modal-bg-6', 'ck-modal-bg-7',
];

export default function RecipeDetailModal({ recipe, onClose }: RecipeDetailModalProps) {
    const [detail, setDetail] = useState<RecipeDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [closing, setClosing] = useState(false);

    // Mange Moi states
    const { user, addJournalEntry } = useCookingAuth();
    const [showMangeMoi, setShowMangeMoi] = useState(false);
    const [mangeMoiMeal, setMangeMoiMeal] = useState<'Petit-déj' | 'Déjeuner' | 'Dîner' | 'Collation'>('Déjeuner');
    const [mangeMoiPortions, setMangeMoiPortions] = useState(1);
    const [mangeMoiSuccess, setMangeMoiSuccess] = useState(false);

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

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://getplanning.org';
        fetch(`${apiBase}/api/cooking/recipe-detail`, {
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
            .then(async res => {
                const data = await res.json();
                if (!res.ok || data.error) {
                    throw new Error(data.error || `Erreur serveur (${res.status})`);
                }
                return data;
            })
            .then(data => {
                const d: RecipeDetail = {
                    ingredients: data.ingredients || [],
                    steps: data.steps || [],
                    tips: data.tips || '',
                };
                setDetail(d);
                setCache(recipe.id, d);
            })
            .catch((err) => setError(err.message || 'Erreur de connexion.'))
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

    const handleMangeMoiSubmit = () => {
        if (!recipe) return;
        addJournalEntry(mangeMoiMeal, recipe.name, recipe.kcal, mangeMoiPortions);
        setMangeMoiSuccess(true);
        setTimeout(() => {
            setShowMangeMoi(false);
            setMangeMoiSuccess(false);
            handleClose(); // optionally close the main modal too
        }, 1500);
    };

    if (!recipe) return null;

    const bgClass = BG_CLASSES[recipe.id % BG_CLASSES.length];

    return (
        <div
            onClick={handleClose}
            className={`ck-rdm-backdrop ${closing ? 'closing' : ''}`}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`ck-rdm-panel ${closing ? 'closing' : ''}`}
            >
                {/* Mange Moi Sub-Modal Overlay */}
                {showMangeMoi && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '1.25rem', padding: '1rem',
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '1rem',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '300px',
                            textAlign: 'center'
                        }}>
                            {mangeMoiSuccess ? (
                                <div>
                                    <span style={{ fontSize: '3rem' }}>✅</span>
                                    <h3 style={{ marginTop: '0.5rem' }}>Ajouté au Journal !</h3>
                                </div>
                            ) : (
                                <>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Mange Moi 🍽️</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--ck-text-muted)', marginBottom: '1.5rem' }}>
                                        {recipe.name}
                                    </p>
                                    
                                    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                        <label className="ck-field-label">Repas</label>
                                        <select 
                                            className="ck-input" 
                                            value={mangeMoiMeal} 
                                            onChange={e => setMangeMoiMeal(e.target.value as 'Petit-déj' | 'Déjeuner' | 'Dîner' | 'Collation')}
                                        >
                                            <option value="Petit-déj">Petit-déj</option>
                                            <option value="Déjeuner">Déjeuner</option>
                                            <option value="Collation">Collation</option>
                                            <option value="Dîner">Dîner</option>
                                        </select>
                                    </div>
                                    
                                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                                        <label className="ck-field-label">Portions</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[0.5, 1, 1.5, 2].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setMangeMoiPortions(p)}
                                                    style={{
                                                        flex: 1, padding: '0.5rem 0', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                                        background: mangeMoiPortions === p ? 'var(--ck-orange, #f58a3d)' : '#f0f0f0',
                                                        color: mangeMoiPortions === p ? 'white' : '#333',
                                                        fontWeight: mangeMoiPortions === p ? 700 : 400,
                                                    }}
                                                >
                                                    x{p}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--ck-orange, #f58a3d)' }}>
                                            Total: {Math.round(recipe.kcal * mangeMoiPortions)} kcal
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            className="ck-btn ck-btn-secondary" 
                                            style={{ flex: 1 }}
                                            onClick={() => setShowMangeMoi(false)}
                                        >
                                            Annuler
                                        </button>
                                        <button 
                                            className="ck-btn ck-btn-primary" 
                                            style={{ flex: 1 }}
                                            onClick={handleMangeMoiSubmit}
                                        >
                                            Valider
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Header / Hero */}
                <div className={`ck-rdm-hero ${bgClass}`}>
                    <button onClick={handleClose} className="ck-rdm-close-btn">
                        ✕
                    </button>
                    <div className="ck-rdm-hero-emoji">{recipe.emoji}</div>
                    <h2 className="ck-rdm-hero-title">{recipe.name}</h2>
                    <div className="ck-rdm-hero-meta">
                        <span>⏱ {recipe.time}</span>
                        <span>📊 {recipe.difficulty}</span>
                        <span className="ck-rdm-hero-kcal">🔥 {recipe.kcal} kcal</span>
                        <span className="ck-rdm-hero-cat">{recipe.category}</span>
                    </div>
                    <div className="ck-rdm-hero-tags">
                        {recipe.fodmap && (
                            <span className="ck-rdm-tag-sage">🥦 FODMAP-safe</span>
                        )}
                        {recipe.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="ck-rdm-tag-lavender">{tag}</span>
                        ))}
                    </div>

                    {user && (
                        <button 
                            className="ck-btn ck-btn-primary ck-fade-up-2"
                            style={{ margin: '1.5rem auto 0', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '2rem', boxShadow: '0 4px 15px rgba(245,138,61,0.3)' }}
                            onClick={() => setShowMangeMoi(true)}
                        >
                            <span>🍽️</span> Mange Moi !
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="ck-rdm-body">
                    {loading && (
                        <div className="ck-rdm-skeleton-col">
                            <div>
                                <div className="ck-rdm-skel-bar ck-rdm-skel-w140 ck-rdm-skel-h14" />
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`ck-rdm-skel-bar ck-rdm-skel-line ck-rdm-skel-d${i}`} />
                                ))}
                            </div>
                            <div>
                                <div className="ck-rdm-skel-bar ck-rdm-skel-w100 ck-rdm-skel-h14 ck-rdm-skel-d3" />
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`ck-rdm-skel-bar ck-rdm-skel-line ck-rdm-skel-d${i + 3}`} />
                                ))}
                            </div>
                            <p className="ck-rdm-loading-text">
                                ✨ Gemini génère les détails…
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="ck-rdm-error">
                            ❌ {error}
                        </div>
                    )}

                    {detail && (
                        <div className="ck-rdm-detail-col">
                            {/* Ingredients */}
                            <div className="ck-rdm-stagger-1">
                                <h4 className="ck-rdm-section-heading ck-rdm-heading-orange">
                                    🧂 Ingrédients
                                </h4>
                                <div className="ck-rdm-ingredient-grid">
                                    {detail.ingredients.map((ing, j) => (
                                        <div key={j} className="ck-rdm-ingredient-item">
                                            {ing}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="ck-rdm-stagger-2">
                                <h4 className="ck-rdm-section-heading ck-rdm-heading-sage">
                                    👩‍🍳 Étapes
                                </h4>
                                <div className="ck-rdm-steps-col">
                                    {detail.steps.map((step, j) => (
                                        <div key={j} className="ck-rdm-step-row">
                                            <span className="ck-rdm-step-number">
                                                {j + 1}
                                            </span>
                                            <span className="ck-rdm-step-text">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tips */}
                            {detail.tips && (
                                <div className="ck-rdm-tips-box">
                                    <span className="ck-rdm-tips-heading">
                                        💡 Astuce du Chef
                                    </span>
                                    <p className="ck-rdm-tips-text">{detail.tips}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
