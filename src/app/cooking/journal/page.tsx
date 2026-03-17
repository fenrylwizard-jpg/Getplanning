'use client';

import React, { useState, useMemo } from 'react';
import { useCookingAuth, SymptomEntry } from '../CookingAuthContext';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { staticRecipes } from '../data/recipesData';

const symptomOptions = [
    { name: 'Ballonnements', emoji: '🫧' },
    { name: 'Douleur abdominale', emoji: '😣' },
    { name: 'Nausée', emoji: '🤢' },
    { name: 'Crampes', emoji: '💥' },
    { name: 'Fatigue', emoji: '😴' },
    { name: 'Brûlures d\'estomac', emoji: '🔥' },
    { name: 'Constipation', emoji: '🧱' },
    { name: 'Diarrhée', emoji: '💧' },
    { name: 'Maux de tête', emoji: '🤕' },
    { name: 'Reflux', emoji: '⬆️' },
];

const mealTypes = ['Petit-déj', 'Déjeuner', 'Dîner', 'Collation'] as const;
const feelingEmojis = ['😫', '😞', '😐', '🙂', '😊'];
const severityLabels = ['', 'Léger', 'Modéré', 'Moyen', 'Fort', 'Sévère'];
const EMPTY_LOG: SymptomEntry[] = [];

export default function JournalPage() {
    const { user, updateUser, addXp } = useCookingAuth();
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterDays, setFilterDays] = useState(7);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    // New entry form state
    const [newMealType, setNewMealType] = useState<typeof mealTypes[number]>('Déjeuner');
    const [newFoods, setNewFoods] = useState<{ name: string; kcal: number }[]>([]);
    const [currentFoodName, setCurrentFoodName] = useState('');
    const [currentFoodKcal, setCurrentFoodKcal] = useState<number | ''>('');
    const [newSymptoms, setNewSymptoms] = useState<{ name: string; severity: 1 | 2 | 3 | 4 | 5; emoji: string }[]>([]);
    const [newFeeling, setNewFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [newNotes, setNewNotes] = useState('');

    // Recipe picker state
    const [showRecipePicker, setShowRecipePicker] = useState(false);
    const [recipeSearch, setRecipeSearch] = useState('');
    const [selectedPortion, setSelectedPortion] = useState(1);

    const log = user?.symptomLog || EMPTY_LOG;

    // Filtered entries
    const filteredLog = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filterDays);
        return log
            .filter(e => new Date(e.date) >= cutoff)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [log, filterDays]);

    // Daily Calorie Tracking (Today)
    const todayStats = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        const todaysEntries = log.filter(e => new Date(e.date).setHours(0, 0, 0, 0) === today);
        let totalKcal = 0;
        todaysEntries.forEach(e => {
            e.foodsEaten.forEach(food => {
                totalKcal += food.kcal;
            });
        });
        return { totalKcal, entriesCount: todaysEntries.length };
    }, [log]);

    // Chart Data for Graphs
    const chartData = useMemo(() => {
        const dataMap = new Map<string, number>();
        const now = new Date();
        const daysToShow = activeTab === 'weekly' ? 7 : 30;

        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dataMap.set(dateStr, 0);
        }

        log.forEach(entry => {
            const dateStr = entry.date.split('T')[0];
            if (dataMap.has(dateStr)) {
                const kcal = entry.foodsEaten.reduce((sum, food) => sum + food.kcal, 0);
                dataMap.set(dateStr, dataMap.get(dateStr)! + kcal);
            }
        });

        return Array.from(dataMap.entries()).map(([date, totalKcal]) => {
            const d = new Date(date);
            return {
                name: `${d.getDate()}/${d.getMonth() + 1}`,
                kcal: totalKcal,
                date: date
            };
        });
    }, [log, activeTab]);

    // Recipe search results
    const recipeResults = useMemo(() => {
        if (!recipeSearch.trim()) return [];
        const q = recipeSearch.toLowerCase();
        return staticRecipes
            .filter(r => r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q)))
            .slice(0, 8);
    }, [recipeSearch]);

    const addRecipeAsFood = (recipe: typeof staticRecipes[0]) => {
        const adjustedKcal = Math.round(recipe.kcal * selectedPortion);
        const portionLabel = selectedPortion !== 1 ? ` (${selectedPortion}×)` : '';
        setNewFoods([...newFoods, { name: `${recipe.name}${portionLabel}`, kcal: adjustedKcal }]);
        setShowRecipePicker(false);
        setRecipeSearch('');
        setSelectedPortion(1);
    };

    // Analytics
    const analytics = useMemo(() => {
        if (log.length === 0) return null;

        const symptomFreq: Record<string, number> = {};
        const foodSymptomMap: Record<string, { count: number; totalSeverity: number }> = {};

        log.forEach(entry => {
            entry.symptoms.forEach(s => {
                symptomFreq[s.name] = (symptomFreq[s.name] || 0) + 1;
                entry.foodsEaten.forEach(food => {
                    const key = food.name.toLowerCase().trim();
                    if (!foodSymptomMap[key]) foodSymptomMap[key] = { count: 0, totalSeverity: 0 };
                    foodSymptomMap[key].count += 1;
                    foodSymptomMap[key].totalSeverity += s.severity;
                });
            });
        });

        const topSymptoms = Object.entries(symptomFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const suspectFoods = Object.entries(foodSymptomMap)
            .sort((a, b) => b[1].totalSeverity - a[1].totalSeverity)
            .slice(0, 5)
            .map(([food, data]) => ({ food, ...data, avgSeverity: data.totalSeverity / data.count }));

        const avgFeeling = log.reduce((sum, e) => sum + e.overallFeeling, 0) / log.length;

        return { topSymptoms, suspectFoods, avgFeeling, totalEntries: log.length };
    }, [log]);

    if (!user) {
        return (
            <div className="ck-glass-section ck-pt-4">
                <div className="ck-empty-state">
                    <div className="ck-empty-state-icon">🔐</div>
                    <h3 className="ck-login-title">Connexion requise</h3>
                    <p className="ck-login-desc">
                        Connectez-vous pour utiliser le journal.
                    </p>
                    <Link href="/cooking/login" className="ck-btn ck-btn-primary">🍴 Se connecter</Link>
                </div>
            </div>
        );
    }

    const toggleSymptom = (symptom: typeof symptomOptions[0]) => {
        const exists = newSymptoms.find(s => s.name === symptom.name);
        if (exists) {
            setNewSymptoms(newSymptoms.filter(s => s.name !== symptom.name));
        } else {
            setNewSymptoms([...newSymptoms, { name: symptom.name, severity: 2, emoji: symptom.emoji }]);
        }
    };

    const updateSymptomSeverity = (name: string, severity: 1 | 2 | 3 | 4 | 5) => {
        setNewSymptoms(newSymptoms.map(s => s.name === name ? { ...s, severity } : s));
    };

    const addFoodItem = () => {
        if (!currentFoodName.trim()) return;
        setNewFoods([...newFoods, { name: currentFoodName.trim(), kcal: Number(currentFoodKcal) || 0 }]);
        setCurrentFoodName('');
        setCurrentFoodKcal('');
    };

    const removeFoodItem = (index: number) => {
        setNewFoods(newFoods.filter((_, i) => i !== index));
    };

    const addEntry = () => {
        if (newFoods.length === 0) return;

        const entry: SymptomEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            mealType: newMealType,
            foodsEaten: newFoods,
            symptoms: newSymptoms,
            overallFeeling: newFeeling,
            notes: newNotes,
        };

        updateUser({ symptomLog: [entry, ...log] });

        const kcalValue = newFoods.reduce((sum, f) => sum + f.kcal, 0);
        let xpReward = 150;
        const targetKcal = user.personalParams?.dailyKcalTarget || 2000;
        const newTotalKcal = todayStats.totalKcal + kcalValue;
        
        if (newTotalKcal <= targetKcal + 100 && newTotalKcal >= targetKcal - 400) {
            xpReward += 100;
        } else if (newTotalKcal > targetKcal + 500) {
            xpReward = 50;
        }
        addXp(xpReward, `Journal: ${newMealType}`);

        setShowAddForm(false);
        setNewFoods([]);
        setNewSymptoms([]);
        setNewFeeling(3);
        setNewNotes('');
    };

    const deleteEntry = (id: number) => {
        updateUser({ symptomLog: log.filter(e => e.id !== id) });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up">
                    <span>📋</span> Suivi &amp; Gamification
                </div>
                <h1 className="ck-fade-up-1">
                    Mon{' '}
                    <span className="ck-text-gradient-coral">
                        Journal
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Notez vos repas pour faire évoluer votre compagnon et surveiller vos macros !
                </p>
            </div>

            <div className="ck-journal-tabs-bar">
                {['daily', 'weekly', 'monthly'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as 'daily' | 'weekly' | 'monthly')}
                        className={`ck-journal-tabs-btn ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab === 'daily' ? "Aujourd'hui" : tab === 'weekly' ? 'Semaine' : 'Mois'}
                    </button>
                ))}
            </div>

            <div className="ck-glass-section">
                
                {/* Daily Calorie Summary */}
                {user.personalParams?.dailyKcalTarget && (
                    <div className="ck-glass-card ck-fade-up-2 ck-kcal-summary ck-mb-xl">
                        <div className="ck-kcal-summary-header">
                            <h2 className="ck-kcal-summary-title">
                                🔥 Calories du Jour
                            </h2>
                            <span className="ck-kcal-summary-value">
                                {todayStats.totalKcal} / {user.personalParams.dailyKcalTarget} kcal
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="ck-kcal-progress-track">
                            <div
                                className={`ck-kcal-progress-fill ${todayStats.totalKcal > user.personalParams.dailyKcalTarget ? 'over' : ''}`}
                                style={{ width: `${Math.min(100, (todayStats.totalKcal / user.personalParams.dailyKcalTarget) * 100)}%` }}
                            />
                        </div>
                        <p className="ck-kcal-progress-note">
                            {todayStats.totalKcal > user.personalParams.dailyKcalTarget 
                                ? `Vous avez dépassé votre objectif de ${todayStats.totalKcal - user.personalParams.dailyKcalTarget} kcal.` 
                                : `Il vous reste ${user.personalParams.dailyKcalTarget - todayStats.totalKcal} kcal pour aujourd'hui. (${todayStats.entriesCount} repas partagés)`}
                        </p>
                    </div>
                )}
                {/* Analytics Dashboard */}
                {analytics && analytics.totalEntries > 0 && (
                    <div className="ck-fade-up-2 ck-mb-xl">
                        <h2 className="ck-chart-heading">📊 Aperçu</h2>
                        <div className="ck-analytics-auto-grid ck-mb-lg">
                            <div className="ck-stat-card">
                                <div className="ck-entry-feeling">📝</div>
                                <div className="ck-stat-value ck-stat-value-orange">{analytics.totalEntries}</div>
                                <div className="ck-stat-label">Entrées</div>
                            </div>
                            <div className="ck-stat-card">
                                <div className="ck-entry-feeling">{feelingEmojis[Math.round(analytics.avgFeeling) - 1]}</div>
                                <div className={`ck-stat-value ${analytics.avgFeeling >= 3.5 ? 'ck-stat-value-sage' : 'ck-stat-value-coral'}`}>
                                    {analytics.avgFeeling.toFixed(1)}/5
                                </div>
                                <div className="ck-stat-label">Bien-être moyen</div>
                            </div>
                            <div className="ck-stat-card">
                                <div className="ck-entry-feeling">⚠️</div>
                                <div className="ck-stat-value ck-stat-value-coral">{analytics.topSymptoms.length}</div>
                                <div className="ck-stat-label">Types de symptômes</div>
                            </div>
                        </div>

                        {/* Suspect Foods */}
                        {analytics.suspectFoods.length > 0 && (
                            <div className="ck-glass-card ck-mb-md">
                                <h3 className="ck-detail-heading ck-detail-heading-coral">
                                    🔍 Aliments suspects
                                </h3>
                                <div className="ck-suspect-foods-list">
                                    {analytics.suspectFoods.map(sf => (
                                        <div key={sf.food} className="ck-list-item ck-suspect-item" style={{ borderLeft: `3px solid ${sf.avgSeverity >= 3 ? 'var(--ck-coral)' : 'var(--ck-orange)'}` }}>
                                            <span className="ck-suspect-name">{sf.food}</span>
                                            <div className="ck-suspect-info">
                                                <span className="ck-suspect-count">{sf.count}× symptômes</span>
                                                <div className={`ck-suspect-severity ${sf.avgSeverity >= 3 ? 'high' : 'med'}`}>
                                                    Sév. {sf.avgSeverity.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Symptoms */}
                        {analytics.topSymptoms.length > 0 && (
                            <div className="ck-glass-card">
                                <h3 className="ck-detail-heading ck-detail-heading-lavender">
                                    📈 Symptômes fréquents
                                </h3>
                                <div className="ck-symptom-grid">
                                    {analytics.topSymptoms.map(([name, count]) => {
                                        const opt = symptomOptions.find(s => s.name === name);
                                        return (
                                            <span key={name} className="ck-tag ck-tag-coral">
                                                {opt?.emoji} {name} ({count}×)
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Graphs (Only in Weekly/Monthly mode) */}
                {activeTab !== 'daily' && user.personalParams?.dailyKcalTarget && (
                    <div className="ck-glass-card ck-fade-up-2 ck-chart-container ck-mb-xl">
                        <h2 className="ck-chart-heading">
                            📈 Historique des Calories ({activeTab === 'weekly' ? '7 derniers jours' : '30 derniers jours'})
                        </h2>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--ck-text-muted)', fontSize: 12 }} dy={10} />
                                <YAxis hide domain={[0, 'dataMax + 500']} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="kcal" radius={[6, 6, 6, 6]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.kcal > (user.personalParams?.dailyKcalTarget || 2000) ? 'var(--ck-coral)' : 'var(--ck-orange)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Add Entry Button */}
                <div className="ck-fade-up-3 ck-journal-action-row">
                    <button
                        className="ck-btn ck-btn-primary"
                        onClick={() => setShowAddForm(!showAddForm)}
                        title={showAddForm ? 'Fermer le formulaire' : 'Ajouter une entrée'}
                    >
                        {showAddForm ? '✕ Fermer' : '+ Ajouter un repas'}
                    </button>

                    {/* Filter */}
                    <div className="ck-journal-filters">
                        {[3, 7, 14, 30].map(days => (
                            <button
                                key={days}
                                className={`ck-tag ${filterDays === days ? 'ck-tag-active-lavender' : 'ck-tag-inactive'}`}
                                title={`Afficher les ${days} derniers jours`}
                                onClick={() => setFilterDays(days)}
                            >
                                {days}j
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Entry Form */}
                {showAddForm && (
                    <div className="ck-glass-card ck-fade-up ck-entry-form ck-mb-lg">
                        <h3 className="ck-entry-form-title">
                            <span className="ck-entry-feeling">📝</span> Nouveau repas
                        </h3>

                        {/* Meal Type */}
                        <div className="ck-mb-md">
                            <label className="ck-field-label">
                                Type de repas
                            </label>
                            <div className="ck-symptom-grid">
                                {mealTypes.map(mt => (
                                    <button
                                        key={mt}
                                        className={`ck-tag ${newMealType === mt ? 'ck-tag-active-orange' : 'ck-tag-inactive'}`}
                                        title={`Sélectionner ${mt}`}
                                        onClick={() => setNewMealType(mt)}
                                    >
                                        {mt === 'Petit-déj' ? '☀️' : mt === 'Déjeuner' ? '🌤️' : mt === 'Dîner' ? '🌙' : '🍪'} {mt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Foods Eaten with Calories */}
                        <div className="ck-mb-md">
                            <label className="ck-field-label">
                                Aliments &amp; Calories
                            </label>

                            {/* Recipe picker toggle */}
                            <div className="ck-journal-tab-row">
                                <button
                                    className={`ck-tag ck-journal-tab-btn ${showRecipePicker ? 'ck-journal-tab-active' : 'ck-journal-tab-inactive'}`}
                                    title="Ajouter depuis les recettes"
                                    onClick={() => { setShowRecipePicker(!showRecipePicker); setRecipeSearch(''); }}
                                >
                                    📖 Ajouter une recette
                                </button>
                                <button
                                    className={`ck-tag ck-journal-tab-btn ${!showRecipePicker ? 'ck-journal-tab-orange-active' : 'ck-journal-tab-inactive'}`}
                                    title="Saisie manuelle"
                                    onClick={() => setShowRecipePicker(false)}
                                >
                                    ✏️ Saisie manuelle
                                </button>
                            </div>

                            {/* Recipe Picker */}
                            {showRecipePicker && (
                                <div className="ck-journal-picker-wrap">
                                    <input
                                        className="ck-input ck-mb-sm"
                                        placeholder="🔍 Chercher une recette (ex: poulet, salade, risotto…)"
                                        value={recipeSearch}
                                        onChange={e => setRecipeSearch(e.target.value)}
                                        autoFocus
                                    />

                                    {/* Portion selector */}
                                    <div className="ck-journal-portion-row">
                                        <span className="ck-journal-portion-label">Portion:</span>
                                        {[0.5, 1, 1.5, 2, 3].map(p => (
                                            <button
                                                key={p}
                                                className={`ck-tag ck-journal-portion-btn ${selectedPortion === p ? 'ck-journal-portion-active' : 'ck-journal-portion-inactive'}`}
                                                title={`${p}× portion`}
                                                onClick={() => setSelectedPortion(p)}
                                            >
                                                {p}×
                                            </button>
                                        ))}
                                    </div>

                                    {/* Recipe search results */}
                                    {recipeResults.length > 0 && (
                                        <div className="ck-journal-results-list">
                                            {recipeResults.map(recipe => (
                                                <button
                                                    key={recipe.id}
                                                    onClick={() => addRecipeAsFood(recipe)}
                                                    className="ck-journal-recipe-btn"
                                                >
                                                    <span className="ck-journal-recipe-emoji">{recipe.emoji}</span>
                                                    <div className="ck-flex-1">
                                                        <div className="ck-journal-recipe-name">{recipe.name}</div>
                                                        <div className="ck-journal-recipe-meta">
                                                            <span>⏱ {recipe.time}</span>
                                                            <span>{recipe.category}</span>
                                                        </div>
                                                    </div>
                                                    <div className="ck-journal-recipe-kcal">
                                                        <div className="ck-journal-recipe-kcal-val">
                                                            {Math.round(recipe.kcal * selectedPortion)} kcal
                                                        </div>
                                                        {selectedPortion !== 1 && (
                                                            <div className="ck-journal-recipe-kcal-sub">
                                                                {recipe.kcal} × {selectedPortion}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {recipeSearch.trim() && recipeResults.length === 0 && (
                                        <p className="ck-journal-empty-msg">
                                            Aucune recette trouvée pour &quot;{recipeSearch}&quot;
                                        </p>
                                    )}

                                    {!recipeSearch.trim() && (
                                        <p className="ck-journal-hint-msg">
                                            Tapez pour rechercher parmi les 1000 recettes
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Manual food entry */}
                            {!showRecipePicker && (
                            <div className="ck-food-row">
                                <input
                                    className="ck-input ck-food-input-name"
                                    placeholder="Nom de l'aliment (ex: Poulet rôti)"
                                    value={currentFoodName}
                                    onChange={e => setCurrentFoodName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addFoodItem()}
                                />
                                <input
                                    className="ck-input ck-food-input-kcal"
                                    placeholder="kcal (ex: 250)"
                                    type="number"
                                    value={currentFoodKcal}
                                    onChange={e => setCurrentFoodKcal(e.target.value === '' ? '' : Number(e.target.value))}
                                    onKeyDown={e => e.key === 'Enter' && addFoodItem()}
                                />
                                <button 
                                    className="ck-btn ck-btn-primary ck-food-add-btn"
                                    onClick={addFoodItem}
                                >
                                    +
                                </button>
                            </div>
                            )}

                            {/* List of added foods */}
                            {newFoods.length > 0 && (
                                <div className="ck-food-list-wrap">
                                    {newFoods.map((food, idx) => (
                                        <div key={idx} className="ck-food-item">
                                            <span className="ck-food-item-name">{food.name}</span>
                                            <div className="ck-food-item-actions">
                                                <span className="ck-food-item-kcal">{food.kcal} kcal</span>
                                                <button 
                                                    onClick={() => removeFoodItem(idx)}
                                                    className="ck-food-item-remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="ck-food-total">
                                        Total: <span className="ck-food-total-kcal">{newFoods.reduce((acc, curr) => acc + curr.kcal, 0)} kcal</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Symptoms */}
                        <div className="ck-mb-md">
                            <label className="ck-field-label">
                                Symptômes (cliquez pour sélectionner)
                            </label>
                            <div className="ck-symptom-grid ck-mb-md">
                                {symptomOptions.map(s => {
                                    const selected = newSymptoms.find(ns => ns.name === s.name);
                                    return (
                                        <button
                                            key={s.name}
                                            className={`ck-tag ${selected ? 'ck-symptom-chip-active' : 'ck-symptom-chip-inactive'}`}
                                            title={`Ajouter ${s.name}`}
                                            onClick={() => toggleSymptom(s)}
                                        >
                                            {s.emoji} {s.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Severity sliders for selected symptoms */}
                            {newSymptoms.length > 0 && (
                                <div className="ck-severity-list">
                                    {newSymptoms.map(s => (
                                        <div key={s.name} className="ck-severity-item">
                                            <span className="ck-severity-emoji">{s.emoji}</span>
                                            <span className="ck-severity-name">{s.name}</span>
                                            <div className="ck-severity-btns">
                                                {([1, 2, 3, 4, 5] as const).map(sev => (
                                                    <button
                                                        key={sev}
                                                        title={`Sévérité ${sev}: ${severityLabels[sev]}`}
                                                        onClick={() => updateSymptomSeverity(s.name, sev)}
                                                        className={`ck-severity-btn ${s.severity >= sev ? 'active' : ''}`}
                                                        style={{ background: s.severity >= sev ? `rgba(255, 107, 107, ${0.15 + sev * 0.15})` : undefined }}
                                                    >
                                                        {sev}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="ck-severity-label-text">
                                                {severityLabels[s.severity]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Overall Feeling */}
                        <div className="ck-mb-md">
                            <label className="ck-field-label">
                                Comment vous sentez-vous ?
                            </label>
                            <div className="ck-feeling-row">
                                {feelingEmojis.map((emoji, i) => {
                                    const val = (i + 1) as 1 | 2 | 3 | 4 | 5;
                                    return (
                                        <button
                                            key={i}
                                            title={`Niveau ${val}/5`}
                                            onClick={() => setNewFeeling(val)}
                                            className={`ck-feeling-btn-item ${newFeeling === val ? 'active' : ''}`}
                                        >
                                            {emoji}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="ck-mb-lg">
                            <label className="ck-field-label">
                                Notes (optionnel)
                            </label>
                            <input
                                className="ck-input"
                                placeholder="Observations, timing des symptômes, etc."
                                value={newNotes}
                                onChange={e => setNewNotes(e.target.value)}
                            />
                        </div>

                        <button
                            className="ck-btn ck-btn-rose ck-save-btn-full"
                            onClick={addEntry}
                            disabled={newFoods.length === 0}
                        >
                            ✓ Enregistrer le repas
                        </button>
                    </div>
                )}

                {/* Log Entries */}
                {filteredLog.length > 0 ? (
                    <div className="ck-modal-col-gap">
                        {filteredLog.map((entry, i) => (
                            <div key={entry.id} className="ck-glass-card ck-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                                <div className="ck-entry-row">
                                    {/* Feeling Emoji */}
                                    <div className={`ck-entry-feeling-box ${entry.overallFeeling >= 4 ? 'good' : entry.overallFeeling >= 3 ? 'ok' : 'bad'}`}>
                                        {feelingEmojis[entry.overallFeeling - 1]}
                                    </div>
                                    <div className="ck-flex-1">
                                        <div className="ck-entry-title-row">
                                            <h3 className="ck-entry-meal-title">
                                                {entry.mealType === 'Petit-déj' ? '☀️' : entry.mealType === 'Déjeuner' ? '🌤️' : entry.mealType === 'Dîner' ? '🌙' : '🍪'} {entry.mealType}
                                            </h3>
                                            <div className="ck-entry-info-row">
                                                <span className="ck-entry-kcal-badge">
                                                    🔥 {entry.foodsEaten.reduce((acc, f) => acc + f.kcal, 0)} kcal
                                                </span>
                                                <span className="ck-entry-date-text">• {formatDate(entry.date)}</span>
                                                <button
                                                    onClick={() => deleteEntry(entry.id)}
                                                    title="Supprimer cette entrée"
                                                    className="ck-entry-delete-btn"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        {/* Foods */}
                                        <div className="ck-entry-foods">
                                            {entry.foodsEaten.map((food, idx) => (
                                                <span key={idx} className="ck-tag ck-tag-orange ck-tag-sm">
                                                    {food.name} <span className="ck-opacity-60">({food.kcal} kcal)</span>
                                                </span>
                                            ))}
                                        </div>

                                        {/* Symptoms */}
                                        {entry.symptoms.length > 0 ? (
                                            <div className="ck-entry-symptoms">
                                                {entry.symptoms.map(s => (
                                                    <span
                                                        key={s.name}
                                                        className="ck-tag ck-tag-sm"
                                                        style={{
                                                            background: `rgba(255, 107, 107, ${0.05 + s.severity * 0.04})`,
                                                            color: 'var(--ck-coral)',
                                                            borderColor: `rgba(255, 107, 107, ${0.1 + s.severity * 0.06})`,
                                                        }}
                                                    >
                                                        {s.emoji} {s.name} ({s.severity}/5)
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="ck-entry-no-symptom">✅ Aucun symptôme</span>
                                        )}

                                        {/* Notes */}
                                        {entry.notes && (
                                            <p className="ck-entry-notes">
                                                💬 {entry.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ck-empty-state">
                        <div className="ck-empty-state-icon">📋</div>
                        <h3 className="ck-login-title">Aucune entrée</h3>
                        <p className="ck-login-desc">
                            Commencez à noter vos repas pour suivre vos symptômes !
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
