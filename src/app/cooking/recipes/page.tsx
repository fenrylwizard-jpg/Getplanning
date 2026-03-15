'use client';

import React, { useState } from 'react';
import { useCookingAuth } from '../CookingAuthContext';
import Link from 'next/link';
import { staticRecipes, recipeCategories } from '../data/recipesData';

interface AIRecipe {
    name: string;
    emoji: string;
    time: string;
    difficulty: string;
    servings: number;
    tags: string[];
    ingredients: string[];
    steps: string[];
    tips: string;
    fodmapSafe: boolean;
    kcalPerServing?: number;
}

export default function RecipesPage() {
    const { user } = useCookingAuth();
    const [aiRecipes, setAiRecipes] = useState<AIRecipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
    const [showAI, setShowAI] = useState(false);

    // Classic recipe filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tous');
    const [fodmapOnly, setFodmapOnly] = useState(false);

    // AI search options
    const [usePantryOnly, setUsePantryOnly] = useState(false);
    const [mealPrepMode, setMealPrepMode] = useState(user?.mealPrepEnabled ?? false);
    const [mealType, setMealType] = useState('');
    const [servings, setServings] = useState(2);
    const [preferences, setPreferences] = useState('');

    // Filtered classic recipes
    const filteredRecipes = staticRecipes.filter(r => {
        if (activeCategory !== 'Tous' && r.category !== activeCategory) return false;
        if (fodmapOnly && !r.fodmap) return false;
        if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
        return true;
    });

    const searchWithAI = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/cooking/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    protocols: user?.protocols || [],
                    protocolPhase: user?.protocolPhase || 1,
                    pantryItems: user?.pantryItems?.map(i => i.name) || [],
                    usePantryOnly,
                    mealPrepMode,
                    servings,
                    mealType,
                    preferences,
                }),
            });

            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setAiRecipes(data.recipes || []);
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up">
                    <span>🍲</span> Bibliothèque de recettes
                </div>
                <h1 className="ck-fade-up-1">
                    Idées de{' '}
                    <span style={{ background: 'linear-gradient(135deg, var(--ck-lavender), var(--ck-plum))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Recettes
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Explorez des recettes délicieuses adaptées à vos besoins alimentaires.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* AI Search Toggle */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="ck-fade-up-2">
                    <button
                        className="ck-btn"
                        title="Voir les recettes classiques"
                        onClick={() => setShowAI(false)}
                        style={{
                            background: !showAI ? 'linear-gradient(135deg, var(--ck-lavender), var(--ck-plum))' : 'rgba(255,255,255,0.5)',
                            color: !showAI ? 'white' : 'var(--ck-text-soft)',
                            border: !showAI ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: !showAI ? '0 4px 20px rgba(196, 167, 231, 0.3)' : 'none',
                        }}
                    >
                        📖 Classiques
                    </button>
                    <button
                        className="ck-btn"
                        title="Chercher avec l'IA Gemini"
                        onClick={() => setShowAI(true)}
                        style={{
                            background: showAI ? 'linear-gradient(135deg, var(--ck-orange), var(--ck-coral))' : 'rgba(255,255,255,0.5)',
                            color: showAI ? 'white' : 'var(--ck-text-soft)',
                            border: showAI ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: showAI ? '0 4px 20px rgba(245, 138, 61, 0.3)' : 'none',
                        }}
                    >
                        ✨ Recherche IA
                    </button>
                </div>

                {/* Classic Recipes */}
                {!showAI && (
                    <div>
                        {/* Search & Filters */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <input
                                className="ck-input"
                                placeholder="🔍 Rechercher une recette ou un tag..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ marginBottom: '0.75rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {recipeCategories.map(cat => (
                                    <button
                                        key={cat.name}
                                        className="ck-tag"
                                        title={`Filtrer par ${cat.name}`}
                                        onClick={() => setActiveCategory(cat.name)}
                                        style={activeCategory === cat.name
                                            ? { background: 'linear-gradient(135deg, var(--ck-lavender), var(--ck-plum))', color: 'white', borderColor: 'transparent' }
                                            : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                        }
                                    >
                                        {cat.emoji} {cat.name}
                                    </button>
                                ))}
                                <button
                                    className="ck-tag"
                                    title="Afficher uniquement les recettes Low-FODMAP"
                                    onClick={() => setFodmapOnly(!fodmapOnly)}
                                    style={fodmapOnly
                                        ? { background: 'var(--ck-sage)', color: 'white', borderColor: 'transparent' }
                                        : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                    }
                                >
                                    🥦 FODMAP-safe
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--ck-text-muted)', marginBottom: '1rem' }}>
                            {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée{filteredRecipes.length > 1 ? 's' : ''}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {filteredRecipes.map((recipe, i) => (
                                <div key={recipe.id} className="ck-recipe-card ck-fade-up" style={{ animationDelay: `${(i % 12) * 0.04}s` }}>
                                    <div className="ck-recipe-img" style={{
                                        background: `linear-gradient(135deg, ${['#FFE5E5', '#E8F5E9', '#EDE7F6', '#FFF3E0', '#FCE4EC', '#E1F5FE', '#FFF8E1', '#F3E5F5'][i % 8]}, ${['#FFDADA', '#D5ECD6', '#E0D4F5', '#FFE8CC', '#F9D0E0', '#D0ECFA', '#FFECB3', '#E1BEE7'][i % 8]})`,
                                    }}>
                                        {recipe.emoji}
                                    </div>
                                    <div className="ck-recipe-body">
                                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{recipe.name}</h3>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--ck-text-muted)' }}>
                                            <span>⏱ {recipe.time}</span>
                                            <span>📊 {recipe.difficulty}</span>
                                            <span style={{ opacity: 0.6 }}>{recipe.category}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--ck-orange)' }}>🔥 {recipe.kcal} kcal</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            {recipe.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="ck-tag ck-tag-lavender" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredRecipes.length === 0 && (
                            <div className="ck-empty-state">
                                <div className="ck-empty-state-icon">🍽️</div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Aucune recette trouvée</h3>
                                <p style={{ color: 'var(--ck-text-muted)' }}>Essayez une autre catégorie ou un autre mot-clé.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Search */}
                {showAI && (
                    <div className="ck-fade-up-3">
                        {!user ? (
                            <div className="ck-glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                                <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Connexion requise</h3>
                                <p style={{ color: 'var(--ck-text-muted)', marginBottom: '1.5rem' }}>
                                    Connectez-vous pour accéder à la recherche IA personnalisée.
                                </p>
                                <Link href="/cooking/login" className="ck-btn ck-btn-primary">
                                    🍴 Se connecter
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* AI Search Form */}
                                <div className="ck-glass-card" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '16px',
                                            background: 'linear-gradient(135deg, var(--ck-orange), var(--ck-coral))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.5rem', boxShadow: '0 4px 15px rgba(245, 138, 61, 0.3)',
                                        }}>
                                            ✨
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Recherche IA — Gemini</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--ck-text-muted)' }}>
                                                Recettes personnalisées selon votre profil
                                            </p>
                                        </div>
                                    </div>

                                    {/* User Profile Summary */}
                                    <div style={{
                                        padding: '1rem', borderRadius: '1rem',
                                        background: 'rgba(245, 138, 61, 0.06)',
                                        border: '1px solid rgba(245, 138, 61, 0.1)',
                                        marginBottom: '1.5rem',
                                    }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                            Votre profil
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {(user.protocols ?? []).length > 0 ? (user.protocols ?? []).map(p => (
                                                <span key={p} className="ck-tag ck-tag-coral" style={{ textTransform: 'capitalize' }}>
                                                    {p.replace('-', ' ')} {p === 'low-fodmap' && `Phase ${user.protocolPhase ?? 1}`}
                                                </span>
                                            )) : (
                                                <span className="ck-tag ck-tag-coral">🍽️ Aucun régime</span>
                                            )}
                                            {user.personalParams?.dailyKcalTarget && (
                                                <span className="ck-tag ck-tag-orange">🔥 Objectif: {user.personalParams.dailyKcalTarget} kcal</span>
                                            )}
                                            <span className="ck-tag ck-tag-sage">🥫 {(user.pantryItems ?? []).length} ingrédients en stock</span>
                                            {user.mealPrepEnabled && <span className="ck-tag ck-tag-lavender">🍱 Meal Prep actif</span>}
                                        </div>
                                    </div>

                                    {/* Search Options */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ck-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                Type de repas
                                            </label>
                                            <select
                                                className="ck-input"
                                                value={mealType}
                                                onChange={e => setMealType(e.target.value)}
                                                style={{ cursor: 'pointer' }}
                                                title="Type de repas"
                                            >
                                                <option value="">Tous les types</option>
                                                <option value="petit-déj">☀️ Petit-déjeuner</option>
                                                <option value="déjeuner">🌤️ Déjeuner</option>
                                                <option value="dîner">🌙 Dîner</option>
                                                <option value="collation">🍪 Collation</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ck-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                Portions
                                            </label>
                                            <input
                                                className="ck-input"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={servings}
                                                onChange={e => setServings(parseInt(e.target.value) || 2)}
                                                title="Nombre de portions"
                                                placeholder="2"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggle Options */}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                        <button
                                            title="Utiliser uniquement les ingrédients du cellier"
                                            className="ck-tag"
                                            onClick={() => setUsePantryOnly(!usePantryOnly)}
                                            style={usePantryOnly
                                                ? { background: 'var(--ck-sage)', color: 'white', borderColor: 'var(--ck-sage)' }
                                                : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                            }
                                        >
                                            🥫 Cellier uniquement
                                        </button>
                                        <button
                                            title="Optimiser pour le meal prep"
                                            className="ck-tag"
                                            onClick={() => setMealPrepMode(!mealPrepMode)}
                                            style={mealPrepMode
                                                ? { background: 'var(--ck-rose)', color: 'white', borderColor: 'var(--ck-rose)' }
                                                : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                            }
                                        >
                                            🍱 Mode Meal Prep
                                        </button>
                                    </div>

                                    {/* Free text preferences */}
                                    <input
                                        className="ck-input"
                                        placeholder="Envies spéciales ? Ex: cuisine asiatique, rapide, peu de cuisson..."
                                        value={preferences}
                                        onChange={e => setPreferences(e.target.value)}
                                        style={{ marginBottom: '1.5rem' }}
                                    />

                                    <button
                                        className="ck-btn ck-btn-primary"
                                        onClick={searchWithAI}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '1rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
                                    >
                                        {loading ? (
                                            <span>✨ Gemini réfléchit... Patienter</span>
                                        ) : (
                                            <span>✨ Générer des recettes personnalisées</span>
                                        )}
                                    </button>
                                </div>

                                {error && (
                                    <div className="ck-glass-card" style={{
                                        background: 'rgba(255, 107, 107, 0.06)',
                                        border: '1px solid rgba(255, 107, 107, 0.2)',
                                        marginBottom: '1.5rem',
                                        padding: '1rem',
                                        color: 'var(--ck-coral)',
                                        fontWeight: 600,
                                    }}>
                                        ❌ {error}
                                    </div>
                                )}

                                {/* AI Results */}
                                {aiRecipes.length > 0 && (
                                    <div>
                                        <h2 style={{ fontWeight: 900, marginBottom: '1rem', fontSize: '1.3rem' }}>
                                            ✨ {aiRecipes.length} recettes générées par Gemini
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {aiRecipes.map((recipe, i) => (
                                                <div
                                                    key={i}
                                                    className="ck-glass-card ck-fade-up"
                                                    style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer' }}
                                                    onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            width: '56px', height: '56px', borderRadius: '16px',
                                                            background: `linear-gradient(135deg, ${['#FFE5E5', '#E8F5E9', '#EDE7F6', '#FFF3E0', '#FCE4EC'][i % 5]}, ${['#FFDADA', '#D5ECD6', '#E0D4F5', '#FFE8CC', '#F9D0E0'][i % 5]})`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '1.75rem', flexShrink: 0,
                                                        }}>
                                                            {recipe.emoji}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{recipe.name}</h3>
                                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--ck-text-muted)', marginTop: '0.25rem' }}>
                                                                <span>⏱ {recipe.time}</span>
                                                                <span>📊 {recipe.difficulty}</span>
                                                                <span>🍽️ {recipe.servings} portions</span>
                                                                {recipe.kcalPerServing && <span style={{ fontWeight: 600, color: 'var(--ck-orange)' }}>🔥 {recipe.kcalPerServing} kcal</span>}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: '1.25rem', transition: 'transform 0.3s', transform: expandedRecipe === i ? 'rotate(180deg)' : 'rotate(0)' }}>
                                                            ▾
                                                        </span>
                                                    </div>

                                                    {/* Tags */}
                                                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                                        {recipe.fodmapSafe && (
                                                            <span className="ck-tag ck-tag-sage" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>🥦 FODMAP-safe</span>
                                                        )}
                                                        {recipe.tags?.map(tag => (
                                                            <span key={tag} className="ck-tag ck-tag-lavender" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Expanded details */}
                                                    {expandedRecipe === i && (
                                                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
                                                            {/* Ingredients */}
                                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-orange)', marginBottom: '0.5rem' }}>
                                                                🧂 Ingrédients
                                                            </h4>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                                                                {recipe.ingredients?.map((ing, j) => (
                                                                    <div key={j} style={{ fontSize: '0.9rem', paddingLeft: '1rem', borderLeft: '2px solid var(--ck-peach-deep)' }}>
                                                                        {ing}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Steps */}
                                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-sage-deep)', marginBottom: '0.5rem' }}>
                                                                👩‍🍳 Étapes
                                                            </h4>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                                                {recipe.steps?.map((step, j) => (
                                                                    <div key={j} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                                                                        <span style={{
                                                                            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                                                            background: 'linear-gradient(135deg, var(--ck-sage), var(--ck-teal))',
                                                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: '0.7rem', fontWeight: 800,
                                                                        }}>
                                                                            {j + 1}
                                                                        </span>
                                                                        <span>{step}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Tips */}
                                                            {recipe.tips && (
                                                                <div style={{
                                                                    padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                                                    background: 'rgba(196, 167, 231, 0.08)',
                                                                    border: '1px solid rgba(196, 167, 231, 0.15)',
                                                                    fontSize: '0.85rem', color: 'var(--ck-lavender-deep)',
                                                                }}>
                                                                    💡 {recipe.tips}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty state for AI */}
                                {!loading && aiRecipes.length === 0 && !error && (
                                    <div className="ck-empty-state">
                                        <div className="ck-empty-state-icon">✨</div>
                                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Prêt à cuisiner ?</h3>
                                        <p style={{ color: 'var(--ck-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                                            Cliquez sur &quot;Générer&quot; pour que Gemini crée des recettes personnalisées basées sur votre profil, votre cellier et vos préférences.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
