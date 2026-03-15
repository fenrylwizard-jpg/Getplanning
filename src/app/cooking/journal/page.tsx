'use client';

import React, { useState, useMemo } from 'react';
import { useCookingAuth, SymptomEntry } from '../CookingAuthContext';
import Link from 'next/link';

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

export default function JournalPage() {
    const { user, updateUser } = useCookingAuth();
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterDays, setFilterDays] = useState(7);

    // New entry form state
    const [newMealType, setNewMealType] = useState<typeof mealTypes[number]>('Déjeuner');
    const [newFoods, setNewFoods] = useState<{ name: string; kcal: number }[]>([]);
    const [currentFoodName, setCurrentFoodName] = useState('');
    const [currentFoodKcal, setCurrentFoodKcal] = useState<number | ''>('');
    const [newSymptoms, setNewSymptoms] = useState<{ name: string; severity: 1 | 2 | 3 | 4 | 5; emoji: string }[]>([]);
    const [newFeeling, setNewFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [newNotes, setNewNotes] = useState('');

    if (!user) {
        return (
            <div className="ck-glass-section" style={{ paddingTop: '4rem' }}>
                <div className="ck-empty-state">
                    <div className="ck-empty-state-icon">🔐</div>
                    <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Connexion requise</h3>
                    <p style={{ color: 'var(--ck-text-muted)', marginBottom: '1.5rem' }}>
                        Connectez-vous pour suivre vos symptômes.
                    </p>
                    <Link href="/cooking/login" className="ck-btn ck-btn-primary">🍴 Se connecter</Link>
                </div>
            </div>
        );
    }

    const log = user.symptomLog || [];

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

    // Analytics
    const analytics = useMemo(() => {
        if (log.length === 0) return null;

        // Count symptom frequency
        const symptomFreq: Record<string, number> = {};
        const foodSymptomMap: Record<string, { count: number; totalSeverity: number }> = {};

        log.forEach(entry => {
            entry.symptoms.forEach(s => {
                symptomFreq[s.name] = (symptomFreq[s.name] || 0) + 1;
                // Map foods to symptoms
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
                    <span>📋</span> Suivi des symptômes
                </div>
                <h1 className="ck-fade-up-1">
                    Mon{' '}
                    <span style={{ background: 'linear-gradient(135deg, var(--ck-coral), var(--ck-rose))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Journal
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Notez vos repas et symptômes pour identifier vos déclencheurs alimentaires.
                </p>
            </div>

            <div className="ck-glass-section">
                
                {/* Daily Calorie Summary */}
                {user.personalParams?.dailyKcalTarget && (
                    <div className="ck-glass-card ck-fade-up-2" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(255,160,122,0.1), rgba(255,107,107,0.05))', border: '1px solid rgba(255,160,122,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🔥 Calories du Jour
                            </h2>
                            <span style={{ fontWeight: 700, color: 'var(--ck-orange)', fontSize: '1.1rem' }}>
                                {todayStats.totalKcal} / {user.personalParams.dailyKcalTarget} kcal
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ 
                                height: '100%', 
                                width: `${Math.min(100, (todayStats.totalKcal / user.personalParams.dailyKcalTarget) * 100)}%`,
                                background: todayStats.totalKcal > user.personalParams.dailyKcalTarget ? 'var(--ck-coral)' : 'linear-gradient(90deg, var(--ck-orange), var(--ck-peach))',
                                transition: 'width 0.5s ease-out'
                            }} />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--ck-text-muted)', margin: 0 }}>
                            {todayStats.totalKcal > user.personalParams.dailyKcalTarget 
                                ? `Vous avez dépassé votre objectif de ${todayStats.totalKcal - user.personalParams.dailyKcalTarget} kcal.` 
                                : `Il vous reste ${user.personalParams.dailyKcalTarget - todayStats.totalKcal} kcal pour aujourd'hui. (${todayStats.entriesCount} repas partagés)`}
                        </p>
                    </div>
                )}
                {/* Analytics Dashboard */}
                {analytics && analytics.totalEntries > 0 && (
                    <div className="ck-fade-up-2" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📊 Aperçu</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="ck-stat-card">
                                <div style={{ fontSize: '1.5rem' }}>📝</div>
                                <div className="ck-stat-value" style={{ color: 'var(--ck-orange)', fontSize: '1.5rem' }}>{analytics.totalEntries}</div>
                                <div className="ck-stat-label">Entrées</div>
                            </div>
                            <div className="ck-stat-card">
                                <div style={{ fontSize: '1.5rem' }}>{feelingEmojis[Math.round(analytics.avgFeeling) - 1]}</div>
                                <div className="ck-stat-value" style={{ color: analytics.avgFeeling >= 3.5 ? 'var(--ck-sage)' : 'var(--ck-coral)', fontSize: '1.5rem' }}>
                                    {analytics.avgFeeling.toFixed(1)}/5
                                </div>
                                <div className="ck-stat-label">Bien-être moyen</div>
                            </div>
                            <div className="ck-stat-card">
                                <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                                <div className="ck-stat-value" style={{ color: 'var(--ck-coral)', fontSize: '1.5rem' }}>{analytics.topSymptoms.length}</div>
                                <div className="ck-stat-label">Types de symptômes</div>
                            </div>
                        </div>

                        {/* Suspect Foods */}
                        {analytics.suspectFoods.length > 0 && (
                            <div className="ck-glass-card" style={{ marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-coral)', marginBottom: '0.75rem' }}>
                                    🔍 Aliments suspects
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {analytics.suspectFoods.map(sf => (
                                        <div key={sf.food} className="ck-list-item" style={{ borderLeft: `3px solid ${sf.avgSeverity >= 3 ? 'var(--ck-coral)' : 'var(--ck-orange)'}` }}>
                                            <span style={{ fontWeight: 700, flex: 1, textTransform: 'capitalize' }}>{sf.food}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--ck-text-muted)' }}>{sf.count}× symptômes</span>
                                                <div style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                                    background: sf.avgSeverity >= 3 ? 'rgba(255, 107, 107, 0.15)' : 'rgba(245, 138, 61, 0.15)',
                                                    color: sf.avgSeverity >= 3 ? 'var(--ck-coral)' : 'var(--ck-orange)',
                                                }}>
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
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-lavender-deep)', marginBottom: '0.75rem' }}>
                                    📈 Symptômes fréquents
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {analytics.topSymptoms.map(([name, count]) => {
                                        const opt = symptomOptions.find(s => s.name === name);
                                        return (
                                            <span key={name} className="ck-tag ck-tag-coral" style={{ fontSize: '0.8rem' }}>
                                                {opt?.emoji} {name} ({count}×)
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Entry Button */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }} className="ck-fade-up-3">
                    <button
                        className="ck-btn ck-btn-primary"
                        onClick={() => setShowAddForm(!showAddForm)}
                        title={showAddForm ? 'Fermer le formulaire' : 'Ajouter une entrée'}
                    >
                        {showAddForm ? '✕ Fermer' : '+ Ajouter un repas'}
                    </button>

                    {/* Filter */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                        {[3, 7, 14, 30].map(days => (
                            <button
                                key={days}
                                className="ck-tag"
                                title={`Afficher les ${days} derniers jours`}
                                onClick={() => setFilterDays(days)}
                                style={filterDays === days
                                    ? { background: 'var(--ck-lavender)', color: 'white', borderColor: 'var(--ck-lavender)' }
                                    : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                }
                            >
                                {days}j
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Entry Form */}
                {showAddForm && (
                    <div className="ck-glass-card ck-fade-up" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--ck-orange)' }}>
                        <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📝</span> Nouveau repas
                        </h3>

                        {/* Meal Type */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                Type de repas
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {mealTypes.map(mt => (
                                    <button
                                        key={mt}
                                        className="ck-tag"
                                        title={`Sélectionner ${mt}`}
                                        onClick={() => setNewMealType(mt)}
                                        style={newMealType === mt
                                            ? { background: 'var(--ck-orange)', color: 'white', borderColor: 'var(--ck-orange)' }
                                            : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                        }
                                    >
                                        {mt === 'Petit-déj' ? '☀️' : mt === 'Déjeuner' ? '🌤️' : mt === 'Dîner' ? '🌙' : '🍪'} {mt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Foods Eaten with Calories */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                Aliments & Calories
                            </label>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <input
                                    className="ck-input"
                                    placeholder="Nom de l'aliment (ex: Poulet rôti)"
                                    value={currentFoodName}
                                    onChange={e => setCurrentFoodName(e.target.value)}
                                    style={{ flex: 2 }}
                                    onKeyDown={e => e.key === 'Enter' && addFoodItem()}
                                />
                                <input
                                    className="ck-input"
                                    placeholder="kcal (ex: 250)"
                                    type="number"
                                    value={currentFoodKcal}
                                    onChange={e => setCurrentFoodKcal(e.target.value === '' ? '' : Number(e.target.value))}
                                    style={{ flex: 1 }}
                                    onKeyDown={e => e.key === 'Enter' && addFoodItem()}
                                />
                                <button 
                                    className="ck-btn ck-btn-primary" 
                                    onClick={addFoodItem}
                                    style={{ padding: '0 1rem' }}
                                >
                                    +
                                </button>
                            </div>

                            {/* List of added foods */}
                            {newFoods.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                    {newFoods.map((food, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 600 }}>{food.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ color: 'var(--ck-orange)', fontWeight: 600 }}>{food.kcal} kcal</span>
                                                <button 
                                                    onClick={() => removeFoodItem(idx)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--ck-coral)', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.35rem', marginTop: '0.35rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                                        Total: <span style={{ color: 'var(--ck-orange)' }}>{newFoods.reduce((acc, curr) => acc + curr.kcal, 0)} kcal</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Symptoms */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                Symptômes (cliquez pour sélectionner)
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                {symptomOptions.map(s => {
                                    const selected = newSymptoms.find(ns => ns.name === s.name);
                                    return (
                                        <button
                                            key={s.name}
                                            className="ck-tag"
                                            title={`Ajouter ${s.name}`}
                                            onClick={() => toggleSymptom(s)}
                                            style={selected
                                                ? { background: 'var(--ck-coral)', color: 'white', borderColor: 'var(--ck-coral)' }
                                                : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                            }
                                        >
                                            {s.emoji} {s.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Severity sliders for selected symptoms */}
                            {newSymptoms.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {newSymptoms.map(s => (
                                        <div key={s.name} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
                                            background: 'rgba(255, 107, 107, 0.04)',
                                        }}>
                                            <span style={{ fontSize: '1.1rem' }}>{s.emoji}</span>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', width: '150px' }}>{s.name}</span>
                                            <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                                                {([1, 2, 3, 4, 5] as const).map(sev => (
                                                    <button
                                                        key={sev}
                                                        title={`Sévérité ${sev}: ${severityLabels[sev]}`}
                                                        onClick={() => updateSymptomSeverity(s.name, sev)}
                                                        style={{
                                                            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                                            cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                                                            background: s.severity >= sev
                                                                ? `rgba(255, 107, 107, ${0.15 + sev * 0.15})`
                                                                : 'rgba(0,0,0,0.04)',
                                                            color: s.severity >= sev ? 'var(--ck-coral)' : 'var(--ck-text-muted)',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        {sev}
                                                    </button>
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--ck-text-muted)', width: '50px', textAlign: 'right' }}>
                                                {severityLabels[s.severity]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Overall Feeling */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                Comment vous sentez-vous ?
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {feelingEmojis.map((emoji, i) => {
                                    const val = (i + 1) as 1 | 2 | 3 | 4 | 5;
                                    return (
                                        <button
                                            key={i}
                                            title={`Niveau ${val}/5`}
                                            onClick={() => setNewFeeling(val)}
                                            style={{
                                                width: '48px', height: '48px', borderRadius: '14px',
                                                border: newFeeling === val ? '2px solid var(--ck-orange)' : '2px solid rgba(0,0,0,0.06)',
                                                background: newFeeling === val ? 'rgba(245, 138, 61, 0.1)' : 'rgba(255,255,255,0.5)',
                                                cursor: 'pointer', fontSize: '1.5rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                transform: newFeeling === val ? 'scale(1.1)' : 'scale(1)',
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
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
                            className="ck-btn ck-btn-rose"
                            onClick={addEntry}
                            style={{ width: '100%', padding: '0.875rem' }}
                            disabled={newFoods.length === 0}
                        >
                            ✓ Enregistrer le repas
                        </button>
                    </div>
                )}

                {/* Log Entries */}
                {filteredLog.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredLog.map((entry, i) => (
                            <div key={entry.id} className="ck-glass-card ck-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    {/* Feeling Emoji */}
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0,
                                        background: entry.overallFeeling >= 4 ? 'rgba(124, 185, 139, 0.1)' : entry.overallFeeling >= 3 ? 'rgba(245, 138, 61, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                                    }}>
                                        {feelingEmojis[entry.overallFeeling - 1]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
                                                {entry.mealType === 'Petit-déj' ? '☀️' : entry.mealType === 'Déjeuner' ? '🌤️' : entry.mealType === 'Dîner' ? '🌙' : '🍪'} {entry.mealType}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--ck-orange)', fontWeight: 700 }}>
                                                    🔥 {entry.foodsEaten.reduce((acc, f) => acc + f.kcal, 0)} kcal
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--ck-text-muted)' }}>• {formatDate(entry.date)}</span>
                                                <button
                                                    onClick={() => deleteEntry(entry.id)}
                                                    title="Supprimer cette entrée"
                                                    style={{
                                                        background: 'rgba(255, 107, 107, 0.1)', border: 'none', borderRadius: '6px',
                                                        padding: '0.2rem 0.4rem', color: 'var(--ck-coral)', cursor: 'pointer',
                                                        fontWeight: 700, fontSize: '0.7rem',
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        {/* Foods */}
                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                            {entry.foodsEaten.map((food, idx) => (
                                                <span key={idx} className="ck-tag ck-tag-orange" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                                                    {food.name} <span style={{ opacity: 0.7 }}>({food.kcal} kcal)</span>
                                                </span>
                                            ))}
                                        </div>

                                        {/* Symptoms */}
                                        {entry.symptoms.length > 0 ? (
                                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                                {entry.symptoms.map(s => (
                                                    <span
                                                        key={s.name}
                                                        className="ck-tag"
                                                        style={{
                                                            fontSize: '0.7rem', padding: '0.15rem 0.5rem',
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
                                            <span style={{ fontSize: '0.8rem', color: 'var(--ck-sage-deep)', fontWeight: 600 }}>✅ Aucun symptôme</span>
                                        )}

                                        {/* Notes */}
                                        {entry.notes && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--ck-text-soft)', marginTop: '0.35rem', fontStyle: 'italic' }}>
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
                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Aucune entrée</h3>
                        <p style={{ color: 'var(--ck-text-muted)' }}>
                            Commencez à noter vos repas pour suivre vos symptômes !
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
