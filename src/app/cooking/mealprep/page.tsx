'use client';

import React, { useState } from 'react';

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface MealSlot {
    id: string;
    day: string;
    meal: 'Petit-déj' | 'Déjeuner' | 'Dîner';
    recipe: string;
    emoji: string;
}

const initialPlan: MealSlot[] = [
    { id: '1', day: 'Lun', meal: 'Petit-déj', recipe: 'Porridge aux fruits', emoji: '🥣' },
    { id: '2', day: 'Lun', meal: 'Déjeuner', recipe: 'Risotto courgettes', emoji: '🍚' },
    { id: '3', day: 'Lun', meal: 'Dîner', recipe: 'Saumon grillé', emoji: '🐟' },
    { id: '4', day: 'Mar', meal: 'Petit-déj', recipe: 'Smoothie fraises', emoji: '🍓' },
    { id: '5', day: 'Mar', meal: 'Déjeuner', recipe: 'Salade quinoa', emoji: '🥗' },
    { id: '6', day: 'Mar', meal: 'Dîner', recipe: 'Poulet aux herbes', emoji: '🍗' },
    { id: '7', day: 'Mer', meal: 'Petit-déj', recipe: 'Crêpes sans gluten', emoji: '🥞' },
    { id: '8', day: 'Mer', meal: 'Déjeuner', recipe: 'Bowl riz tofu', emoji: '🍜' },
    { id: '9', day: 'Jeu', meal: 'Déjeuner', recipe: 'Soupe de carottes', emoji: '🥕' },
    { id: '10', day: 'Ven', meal: 'Dîner', recipe: 'Pâtes pesto maison', emoji: '🍝' },
];

const mealTypes = ['Petit-déj', 'Déjeuner', 'Dîner'] as const;

const prepTasks = [
    { id: 1, task: 'Faire cuire le riz et le quinoa pour la semaine', done: true, emoji: '🍚' },
    { id: 2, task: 'Laver et couper les légumes (carottes, courgettes)', done: true, emoji: '🥕' },
    { id: 3, task: 'Mariner le poulet aux herbes', done: false, emoji: '🍗' },
    { id: 4, task: 'Préparer la sauce pesto maison', done: false, emoji: '🌿' },
    { id: 5, task: 'Portionner les fruits pour les smoothies', done: false, emoji: '🍓' },
    { id: 6, task: 'Faire la soupe de carottes (batch)', done: false, emoji: '🥣' },
];

export default function MealPrepPage() {
    const [plan] = useState(initialPlan);
    const [tasks, setTasks] = useState(prepTasks);
    const [view, setView] = useState<'planning' | 'prep'>('planning');

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const doneTasks = tasks.filter(t => t.done).length;
    const totalTasks = tasks.length;

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up">
                    <span>🍱</span> Organisation des repas
                </div>
                <h1 className="ck-fade-up-1">
                    Meal{' '}
                    <span style={{ background: 'linear-gradient(135deg, var(--ck-rose), var(--ck-coral))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Prep
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Planifiez vos repas et organisez vos préparations pour la semaine.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* View Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }} className="ck-fade-up-2">
                    <button
                        className="ck-btn"
                        title="Voir le planning de la semaine"
                        onClick={() => setView('planning')}
                        style={{
                            background: view === 'planning'
                                ? 'linear-gradient(135deg, var(--ck-rose), var(--ck-coral))'
                                : 'rgba(255,255,255,0.5)',
                            color: view === 'planning' ? 'white' : 'var(--ck-text-soft)',
                            border: view === 'planning' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: view === 'planning' ? '0 4px 20px rgba(244, 114, 182, 0.3)' : 'none',
                        }}
                    >
                        📅 Planning
                    </button>
                    <button
                        className="ck-btn"
                        title="Voir les tâches de préparation"
                        onClick={() => setView('prep')}
                        style={{
                            background: view === 'prep'
                                ? 'linear-gradient(135deg, var(--ck-sage), var(--ck-teal))'
                                : 'rgba(255,255,255,0.5)',
                            color: view === 'prep' ? 'white' : 'var(--ck-text-soft)',
                            border: view === 'prep' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: view === 'prep' ? '0 4px 20px rgba(124, 185, 139, 0.3)' : 'none',
                        }}
                    >
                        ✅ Préparation ({doneTasks}/{totalTasks})
                    </button>
                </div>

                {/* Planning View */}
                {view === 'planning' && (
                    <div className="ck-fade-up-3">
                        {/* Weekly Grid */}
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${weekDays.length}, minmax(140px, 1fr))`, gap: '0.5rem', minWidth: '900px' }}>
                                {/* Header Row */}
                                <div />
                                {weekDays.map(day => (
                                    <div key={day} style={{
                                        textAlign: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        padding: '0.75rem',
                                        borderRadius: '1rem',
                                        background: 'rgba(245, 138, 61, 0.06)',
                                    }}>
                                        {day}
                                    </div>
                                ))}

                                {/* Meal Rows */}
                                {mealTypes.map(mealType => (
                                    <React.Fragment key={mealType}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: 'var(--ck-text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.03em',
                                        }}>
                                            {mealType === 'Petit-déj' ? '☀️' : mealType === 'Déjeuner' ? '🌤️' : '🌙'} {mealType}
                                        </div>
                                        {weekDays.map(day => {
                                            const slot = plan.find(p => p.day === day && p.meal === mealType);
                                            return (
                                                <div
                                                    key={`${day}-${mealType}`}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: '1rem',
                                                        background: slot ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.02)',
                                                        border: slot ? '1px solid rgba(245, 138, 61, 0.1)' : '1px dashed rgba(0,0,0,0.06)',
                                                        minHeight: '65px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.25s ease',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {slot ? (
                                                        <>
                                                            <span style={{ fontSize: '1.25rem' }}>{slot.emoji}</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.3 }}>{slot.recipe}</span>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--ck-text-muted)' }}>+ Ajouter</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                            <div className="ck-stat-card">
                                <div style={{ fontSize: '1.75rem' }}>🍽️</div>
                                <div className="ck-stat-value" style={{ color: 'var(--ck-orange)', fontSize: '1.5rem' }}>
                                    {plan.length}
                                </div>
                                <div className="ck-stat-label">Repas planifiés</div>
                            </div>
                            <div className="ck-stat-card">
                                <div style={{ fontSize: '1.75rem' }}>📅</div>
                                <div className="ck-stat-value" style={{ color: 'var(--ck-sage)', fontSize: '1.5rem' }}>
                                    {new Set(plan.map(p => p.day)).size}
                                </div>
                                <div className="ck-stat-label">Jours couverts</div>
                            </div>
                            <div className="ck-stat-card">
                                <div style={{ fontSize: '1.75rem' }}>🍳</div>
                                <div className="ck-stat-value" style={{ color: 'var(--ck-rose)', fontSize: '1.5rem' }}>
                                    {new Set(plan.map(p => p.recipe)).size}
                                </div>
                                <div className="ck-stat-label">Recettes uniques</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prep View */}
                {view === 'prep' && (
                    <div className="ck-fade-up-3">
                        {/* Progress */}
                        <div className="ck-glass-card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: 800 }}>Session de préparation</span>
                                <span style={{ fontWeight: 700, color: doneTasks === totalTasks ? 'var(--ck-sage)' : 'var(--ck-rose)' }}>
                                    {doneTasks}/{totalTasks} tâches
                                </span>
                            </div>
                            <div style={{ height: '8px', borderRadius: '9999px', background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(doneTasks / totalTasks) * 100}%`,
                                    borderRadius: '9999px',
                                    background: doneTasks === totalTasks
                                        ? 'linear-gradient(90deg, var(--ck-sage), var(--ck-teal))'
                                        : 'linear-gradient(90deg, var(--ck-rose), var(--ck-coral))',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>

                        {/* Task List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    className="ck-list-item"
                                    onClick={() => toggleTask(task.id)}
                                    style={{
                                        cursor: 'pointer',
                                        opacity: task.done ? 0.5 : 1,
                                        transition: 'all 0.3s ease',
                                        borderLeft: `3px solid ${task.done ? 'var(--ck-sage)' : 'var(--ck-rose)'}`,
                                    }}
                                >
                                    <div className={`ck-checkbox ${task.done ? 'checked' : ''}`}>
                                        {task.done && '✓'}
                                    </div>
                                    <span style={{ fontSize: '1.5rem' }}>{task.emoji}</span>
                                    <span style={{
                                        fontWeight: 600,
                                        flex: 1,
                                        textDecoration: task.done ? 'line-through' : 'none',
                                    }}>
                                        {task.task}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
