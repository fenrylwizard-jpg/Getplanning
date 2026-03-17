'use client';

import React, { useState } from 'react';
import { useCookingAuth } from '../CookingAuthContext';
import Link from 'next/link';
import { staticRecipes, recipeCategories, StaticRecipe } from '../data/recipesData';
import RecipeDetailModal from '../components/RecipeDetailModal';

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

const GRADIENT_BGS = [
    'linear-gradient(135deg, #FFE5E5, #FFDADA)',
    'linear-gradient(135deg, #E8F5E9, #D5ECD6)',
    'linear-gradient(135deg, #EDE7F6, #E0D4F5)',
    'linear-gradient(135deg, #FFF3E0, #FFE8CC)',
    'linear-gradient(135deg, #FCE4EC, #F9D0E0)',
    'linear-gradient(135deg, #E1F5FE, #D0ECFA)',
    'linear-gradient(135deg, #FFF8E1, #FFECB3)',
    'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
];

export default function RecipesPage() {
    const { user } = useCookingAuth();
    const [aiRecipes, setAiRecipes] = useState<AIRecipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
    const [showAI, setShowAI] = useState(false);
    const [selectedStaticRecipe, setSelectedStaticRecipe] = useState<StaticRecipe | null>(null);

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
                    <span className="ck-text-gradient-lavender">
                        Recettes
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Explorez des recettes délicieuses adaptées à vos besoins alimentaires.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* AI Search Toggle */}
                <div className="ck-toggle-row ck-fade-up-2">
                    <button
                        className={`ck-btn ${!showAI ? 'ck-btn-toggle-lavender' : 'ck-btn-toggle-inactive'}`}
                        title="Voir les recettes classiques"
                        onClick={() => setShowAI(false)}
                    >
                        📖 Classiques
                    </button>
                    <button
                        className={`ck-btn ${showAI ? 'ck-btn-toggle-orange' : 'ck-btn-toggle-inactive'}`}
                        title="Chercher avec l'IA Gemini"
                        onClick={() => setShowAI(true)}
                    >
                        ✨ Recherche IA
                    </button>
                </div>

                {/* Classic Recipes */}
                {!showAI && (
                    <div>
                        {/* Search & Filters */}
                        <div className="ck-mb-lg">
                            <input
                                className="ck-input ck-mb-sm"
                                placeholder="🔍 Rechercher une recette ou un tag..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className="ck-filter-row">
                                {recipeCategories.map(cat => (
                                    <button
                                        key={cat.name}
                                        className={`ck-tag ${activeCategory === cat.name ? 'ck-tag-active-lavender' : 'ck-tag-inactive'}`}
                                        title={`Filtrer par ${cat.name}`}
                                        onClick={() => setActiveCategory(cat.name)}
                                    >
                                        {cat.emoji} {cat.name}
                                    </button>
                                ))}
                                <button
                                    className={`ck-tag ${fodmapOnly ? 'ck-tag-active-sage' : 'ck-tag-inactive'}`}
                                    title="Afficher uniquement les recettes Low-FODMAP"
                                    onClick={() => setFodmapOnly(!fodmapOnly)}
                                >
                                    🥦 FODMAP-safe
                                </button>
                            </div>
                        </div>

                        <p className="ck-recipe-count">
                            {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée{filteredRecipes.length > 1 ? 's' : ''}
                        </p>

                        <div className="ck-recipe-grid">
                            {filteredRecipes.map((recipe, i) => (
                                <div
                                    key={recipe.id}
                                    className="ck-recipe-card ck-fade-up"
                                    style={{ animationDelay: `${(i % 12) * 0.04}s` }}
                                    onClick={() => setSelectedStaticRecipe(recipe)}
                                >
                                    <div className="ck-recipe-img" style={{ background: GRADIENT_BGS[i % 8] }}>
                                        {recipe.emoji}
                                    </div>
                                    <div className="ck-recipe-body">
                                        <h3 className="ck-recipe-title">{recipe.name}</h3>
                                        <div className="ck-recipe-meta">
                                            <span>⏱ {recipe.time}</span>
                                            <span>📊 {recipe.difficulty}</span>
                                            <span className="ck-meta-dim">{recipe.category}</span>
                                            <span className="ck-recipe-kcal">🔥 {recipe.kcal} kcal</span>
                                        </div>
                                        <div className="ck-recipe-tags">
                                            {recipe.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="ck-tag ck-tag-lavender ck-recipe-tag-sm">
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
                                <h3 className="ck-login-title">Aucune recette trouvée</h3>
                                <p className="ck-login-desc">Essayez une autre catégorie ou un autre mot-clé.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Search */}
                {showAI && (
                    <div className="ck-fade-up-3">
                        {!user ? (
                            <div className="ck-glass-card ck-login-prompt">
                                <div className="ck-login-prompt-icon">🔐</div>
                                <h3 className="ck-login-title">Connexion requise</h3>
                                <p className="ck-login-desc">
                                    Connectez-vous pour accéder à la recherche IA personnalisée.
                                </p>
                                <Link href="/cooking/login" className="ck-btn ck-btn-primary">
                                    🍴 Se connecter
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* AI Search Form */}
                                <div className="ck-glass-card ck-mb-lg">
                                    <div className="ck-ai-header">
                                        <div className="ck-ai-icon-box">
                                            ✨
                                        </div>
                                        <div>
                                            <h3 className="ck-ai-title">Recherche IA — Gemini</h3>
                                            <p className="ck-ai-subtitle">
                                                Recettes personnalisées selon votre profil
                                            </p>
                                        </div>
                                    </div>

                                    {/* User Profile Summary */}
                                    <div className="ck-ai-profile-box">
                                        <div className="ck-small-label">
                                            Votre profil
                                        </div>
                                        <div className="ck-profile-tags">
                                            {(user.protocols ?? []).length > 0 ? (user.protocols ?? []).map(p => (
                                                <span key={p} className="ck-tag ck-tag-coral ck-text-capitalize">
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
                                    <div className="ck-ai-options-grid">
                                        <div>
                                            <label className="ck-ai-search-label">
                                                Type de repas
                                            </label>
                                            <select
                                                className="ck-input ck-cursor-pointer"
                                                value={mealType}
                                                onChange={e => setMealType(e.target.value)}
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
                                            <label className="ck-ai-search-label">
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
                                    <div className="ck-filter-row ck-mb-lg">
                                        <button
                                            title="Utiliser uniquement les ingrédients du cellier"
                                            className={`ck-tag ${usePantryOnly ? 'ck-tag-active-sage' : 'ck-tag-inactive'}`}
                                            onClick={() => setUsePantryOnly(!usePantryOnly)}
                                        >
                                            🥫 Cellier uniquement
                                        </button>
                                        <button
                                            title="Optimiser pour le meal prep"
                                            className={`ck-tag ${mealPrepMode ? 'ck-tag-active-rose' : 'ck-tag-inactive'}`}
                                            onClick={() => setMealPrepMode(!mealPrepMode)}
                                        >
                                            🍱 Mode Meal Prep
                                        </button>
                                    </div>

                                    {/* Free text preferences */}
                                    <input
                                        className="ck-input ck-mb-lg"
                                        placeholder="Envies spéciales ? Ex: cuisine asiatique, rapide, peu de cuisson..."
                                        value={preferences}
                                        onChange={e => setPreferences(e.target.value)}
                                    />

                                    <button
                                        className={`ck-btn ck-btn-primary ck-search-btn-full${loading ? ' ck-btn-loading' : ''}`}
                                        onClick={searchWithAI}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span>✨ Gemini réfléchit... Patienter</span>
                                        ) : (
                                            <span>✨ Générer des recettes personnalisées</span>
                                        )}
                                    </button>
                                </div>

                                {error && (
                                    <div className="ck-glass-card ck-error-card">
                                        ❌ {error}
                                    </div>
                                )}

                                {/* AI Results */}
                                {aiRecipes.length > 0 && (
                                    <div>
                                        <h2 className="ck-ai-results-title">
                                            ✨ {aiRecipes.length} recettes générées par Gemini
                                        </h2>
                                        <div className="ck-ai-recipe-list">
                                            {aiRecipes.map((recipe, i) => (
                                                <div
                                                    key={i}
                                                    className="ck-glass-card ck-fade-up ck-clickable"
                                                    style={{ animationDelay: `${i * 0.1}s` }}
                                                    onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
                                                >
                                                    <div className="ck-ai-recipe-row">
                                                        <div className="ck-ai-recipe-icon" style={{ background: GRADIENT_BGS[i % 5] }}>
                                                            {recipe.emoji}
                                                        </div>
                                                        <div className="ck-flex-1">
                                                            <h3 className="ck-ai-recipe-title">{recipe.name}</h3>
                                                            <div className="ck-ai-recipe-meta">
                                                                <span>⏱ {recipe.time}</span>
                                                                <span>📊 {recipe.difficulty}</span>
                                                                <span>🍽️ {recipe.servings} portions</span>
                                                                {recipe.kcalPerServing && <span className="ck-recipe-kcal">🔥 {recipe.kcalPerServing} kcal</span>}
                                                            </div>
                                                        </div>
                                                        <span className={`ck-ai-expand-arrow${expandedRecipe === i ? ' open' : ''}`}>
                                                            ▾
                                                        </span>
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="ck-recipe-tags ck-mt-sm">
                                                        {recipe.fodmapSafe && (
                                                            <span className="ck-tag ck-tag-sage ck-recipe-tag-sm">🥦 FODMAP-safe</span>
                                                        )}
                                                        {recipe.tags?.map(tag => (
                                                            <span key={tag} className="ck-tag ck-tag-lavender ck-recipe-tag-sm">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Expanded details */}
                                                    {expandedRecipe === i && (
                                                        <div className="ck-detail-section">
                                                            {/* Ingredients */}
                                                            <h4 className="ck-detail-heading ck-detail-heading-orange">
                                                                🧂 Ingrédients
                                                            </h4>
                                                            <div className="ck-ingredient-list">
                                                                {recipe.ingredients?.map((ing, j) => (
                                                                    <div key={j} className="ck-ingredient-item">
                                                                        {ing}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Steps */}
                                                            <h4 className="ck-detail-heading ck-detail-heading-sage">
                                                                👩‍🍳 Étapes
                                                            </h4>
                                                            <div className="ck-steps-list">
                                                                {recipe.steps?.map((step, j) => (
                                                                    <div key={j} className="ck-step-row">
                                                                        <span className="ck-step-number">
                                                                            {j + 1}
                                                                        </span>
                                                                        <span>{step}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Tips */}
                                                            {recipe.tips && (
                                                                <div className="ck-tips-box">
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
                                        <h3 className="ck-login-title">Prêt à cuisiner ?</h3>
                                        <p className="ck-login-desc ck-empty-centered">
                                            Cliquez sur &quot;Générer&quot; pour que Gemini crée des recettes personnalisées basées sur votre profil, votre cellier et vos préférences.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Recipe Detail Modal */}
            <RecipeDetailModal
                recipe={selectedStaticRecipe}
                onClose={() => setSelectedStaticRecipe(null)}
            />
        </>
    );
}
