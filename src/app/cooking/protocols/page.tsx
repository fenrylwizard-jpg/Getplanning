'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { diets } from '../data/dietsData';

export default function ProtocolsPage() {
    const [activeDietId, setActiveDietId] = useState(diets[0].id);
    const [activePhase, setActivePhase] = useState(0);
    const diet = diets.find(d => d.id === activeDietId) || diets[0];

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up" style={{ marginBottom: '1rem' }}>
                    <span>🔬</span> Régimes & Protocoles
                </div>
                <h1 className="ck-fade-up-1">
                    Choisissez votre<br />
                    <span style={{ background: 'linear-gradient(135deg, var(--ck-coral), var(--ck-orange))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        régime
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    12 régimes alimentaires populaires avec guides détaillés, aliments autorisés et conseils pratiques.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* Diet Selector Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }} className="ck-fade-up-2">
                    {diets.map(d => (
                        <button
                            key={d.id}
                            onClick={() => { setActiveDietId(d.id); setActivePhase(0); }}
                            className="ck-glass-card"
                            title={d.name}
                            style={{
                                textAlign: 'center',
                                padding: '1rem 0.5rem',
                                cursor: 'pointer',
                                border: activeDietId === d.id ? `2px solid ${d.color}` : '1px solid var(--ck-glass-border)',
                                background: activeDietId === d.id ? `${d.color}10` : 'var(--ck-glass-bg)',
                                transition: 'all 0.3s ease',
                                transform: activeDietId === d.id ? 'scale(1.03)' : 'scale(1)',
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{d.emoji}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: activeDietId === d.id ? d.color : 'var(--ck-text-soft)' }}>
                                {d.name}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Diet Detail */}
                <div className="ck-phase-card ck-fade-up-3" key={activeDietId}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '20px',
                            background: `linear-gradient(135deg, ${diet.color}, ${diet.color}aa)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', boxShadow: `0 8px 25px ${diet.color}30`, flexShrink: 0,
                        }}>
                            {diet.emoji}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{diet.name}</h2>
                            <p style={{ fontSize: '0.85rem', color: diet.color, fontWeight: 600, marginTop: '0.25rem' }}>
                                {diet.tagline}
                            </p>
                        </div>
                    </div>

                    <p style={{ color: 'var(--ck-text-soft)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: '700px' }}>
                        {diet.description}
                    </p>

                    {/* Phases (for Low-FODMAP) */}
                    {diet.phases && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {diet.phases.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActivePhase(i)}
                                        className="ck-btn"
                                        title={p.title}
                                        style={{
                                            background: activePhase === i ? `linear-gradient(135deg, ${diet.color}, ${diet.color}dd)` : 'rgba(255,255,255,0.5)',
                                            color: activePhase === i ? 'white' : 'var(--ck-text-soft)',
                                            border: activePhase === i ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {p.icon} {p.title}
                                    </button>
                                ))}
                            </div>
                            <div className="ck-glass-card" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '1.75rem' }}>{diet.phases[activePhase].icon}</span>
                                    <div>
                                        <h3 style={{ fontWeight: 800 }}>{diet.phases[activePhase].title}</h3>
                                        <span className="ck-tag ck-tag-orange" style={{ fontSize: '0.7rem' }}>⏱ {diet.phases[activePhase].duration}</span>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--ck-text-soft)', lineHeight: 1.6 }}>{diet.phases[activePhase].desc}</p>

                                {diet.phases[activePhase].avoidFoods && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-coral)', marginBottom: '0.5rem' }}>❌ À éviter</h4>
                                            {diet.phases[activePhase].avoidFoods!.map(f => (
                                                <div key={f.name} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-coral)', marginBottom: '0.35rem' }}>
                                                    <span style={{ fontSize: '1.25rem' }}>{f.emoji}</span>
                                                    <span style={{ fontWeight: 600 }}>{f.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-sage-deep)', marginBottom: '0.5rem' }}>✅ Autorisés</h4>
                                            {diet.phases[activePhase].okFoods!.map(f => (
                                                <div key={f.name} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-sage)', marginBottom: '0.35rem' }}>
                                                    <span style={{ fontSize: '1.25rem' }}>{f.emoji}</span>
                                                    <span style={{ fontWeight: 600 }}>{f.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {diet.phases[activePhase].tips && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {diet.phases[activePhase].tips!.map((tip, i) => (
                                            <div key={i} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-sage)' }}>
                                                <span>💡</span> <span style={{ fontWeight: 500 }}>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Food Lists (for diets without phases) */}
                    {!diet.phases && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-coral)', marginBottom: '0.75rem' }}>
                                    ❌ À éviter
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {diet.avoidFoods.map(f => (
                                        <div key={f.name} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-coral)' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{f.emoji}</span>
                                            <span style={{ fontWeight: 600 }}>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-sage-deep)', marginBottom: '0.75rem' }}>
                                    ✅ Autorisés & recommandés
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {diet.okFoods.map(f => (
                                        <div key={f.name} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-sage)' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{f.emoji}</span>
                                            <span style={{ fontWeight: 600 }}>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-orange)', marginBottom: '0.75rem' }}>
                            💡 Conseils pratiques
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {diet.tips.map((tip, i) => (
                                <div key={i} className="ck-list-item" style={{ borderLeft: `3px solid ${diet.color}` }}>
                                    <span style={{ fontWeight: 500 }}>{tip}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div style={{ textAlign: 'center', marginTop: '2rem' }} className="ck-fade-up-4">
                    <Link href="/cooking/recipes" className="ck-btn ck-btn-primary">
                        🍲 Voir les recettes adaptées
                    </Link>
                </div>
            </div>
        </>
    );
}
