'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const phases = [
    {
        number: 1,
        title: 'Phase d\'Élimination',
        duration: '2–6 semaines',
        color: 'var(--ck-coral)',
        icon: '🚫',
        desc: 'Supprimez tous les aliments riches en FODMAP de votre alimentation pour calmer vos symptômes digestifs.',
        foods: [
            { name: 'Ail & oignon', status: 'avoid', emoji: '🧅' },
            { name: 'Blé & seigle', status: 'avoid', emoji: '🌾' },
            { name: 'Lait & yaourt', status: 'avoid', emoji: '🥛' },
            { name: 'Pommes & poires', status: 'avoid', emoji: '🍎' },
            { name: 'Riz & quinoa', status: 'ok', emoji: '🍚' },
            { name: 'Carottes & courgettes', status: 'ok', emoji: '🥕' },
            { name: 'Fraises & myrtilles', status: 'ok', emoji: '🍓' },
            { name: 'Fromages à pâte dure', status: 'ok', emoji: '🧀' },
        ],
    },
    {
        number: 2,
        title: 'Phase de Réintroduction',
        duration: '6–8 semaines',
        color: 'var(--ck-orange)',
        icon: '🔬',
        desc: 'Réintroduisez systématiquement chaque groupe de FODMAP, un à la fois, pour identifier vos déclencheurs personnels.',
        groups: [
            { name: 'Fructose', emoji: '🍯', example: 'Miel, mangue' },
            { name: 'Lactose', emoji: '🥛', example: 'Lait, crème glacée' },
            { name: 'Fructanes', emoji: '🧅', example: 'Ail, oignon, blé' },
            { name: 'Galactanes', emoji: '🫘', example: 'Lentilles, pois chiches' },
            { name: 'Polyols', emoji: '🍑', example: 'Avocat, champignons' },
        ],
    },
    {
        number: 3,
        title: 'Phase de Personnalisation',
        duration: 'Long terme',
        color: 'var(--ck-sage)',
        icon: '✨',
        desc: 'Créez votre régime personnalisé en réintégrant les aliments que vous tolérez bien. Liberté retrouvée !',
        tips: [
            'Notez vos tolérances dans un journal alimentaire',
            'Réessayez les aliments sensibles après 3 mois',
            'Consultez un diététicien pour un suivi personnalisé',
            'Les tolérances peuvent évoluer avec le temps',
        ],
    },
];

export default function ProtocolsPage() {
    const [activePhase, setActivePhase] = useState(0);
    const phase = phases[activePhase];

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up" style={{ marginBottom: '1rem' }}>
                    <span>🔬</span> Protocole Low-FODMAP
                </div>
                <h1 className="ck-fade-up-1">
                    Découvrez vos<br />
                    <span style={{ background: 'linear-gradient(135deg, var(--ck-coral), var(--ck-orange))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        intolérances
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Le protocole Low-FODMAP en 3 phases vous aide à identifier précisément quels aliments causent vos inconforts digestifs.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* Phase Selector */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }} className="ck-fade-up-2">
                    {phases.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setActivePhase(i)}
                            className="ck-btn"
                            title={`Phase ${p.number}: ${p.title}`}
                            style={{
                                background: activePhase === i
                                    ? `linear-gradient(135deg, ${p.color}, ${p.color}dd)`
                                    : 'rgba(255,255,255,0.5)',
                                color: activePhase === i ? 'white' : 'var(--ck-text-soft)',
                                border: activePhase === i ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                boxShadow: activePhase === i ? `0 4px 20px ${p.color}40` : 'none',
                            }}
                        >
                            {p.icon} Phase {p.number}
                        </button>
                    ))}
                </div>

                {/* Active Phase Card */}
                <div className="ck-phase-card ck-fade-up-3" key={activePhase}>
                    <div className="ck-phase-number" style={{ color: phase.color }}>{phase.number}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2.5rem' }}>{phase.icon}</div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{phase.title}</h2>
                            <div className="ck-tag ck-tag-orange" style={{ marginTop: '0.5rem' }}>⏱ {phase.duration}</div>
                        </div>
                    </div>

                    <p style={{ color: 'var(--ck-text-soft)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: '700px' }}>
                        {phase.desc}
                    </p>

                    {/* Phase 1: Food lists */}
                    {phase.foods && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-coral)', marginBottom: '0.75rem' }}>
                                    ❌ À éviter
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {phase.foods.filter(f => f.status === 'avoid').map(f => (
                                        <div key={f.name} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-coral)' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{f.emoji}</span>
                                            <span style={{ fontWeight: 600 }}>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-sage-deep)', marginBottom: '0.75rem' }}>
                                    ✅ Autorisés
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {phase.foods.filter(f => f.status === 'ok').map(f => (
                                        <div key={f.name} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-sage)' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{f.emoji}</span>
                                            <span style={{ fontWeight: 600 }}>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase 2: FODMAP Groups */}
                    {phase.groups && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {phase.groups.map(g => (
                                <div key={g.name} className="ck-glass-card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{g.emoji}</div>
                                    <h4 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{g.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--ck-text-muted)' }}>{g.example}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Phase 3: Tips */}
                    {phase.tips && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {phase.tips.map((tip, i) => (
                                <div key={i} className="ck-list-item" style={{ borderLeft: '3px solid var(--ck-sage)' }}>
                                    <span style={{ fontSize: '1.25rem' }}>💡</span>
                                    <span style={{ fontWeight: 500 }}>{tip}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
