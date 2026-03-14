'use client';

import React from 'react';
import Link from 'next/link';

const features = [
    {
        href: '/cooking/protocols',
        icon: '🥦',
        iconBg: 'icon-bg-coral',
        cardClass: 'card-coral',
        arrowClass: 'arrow-coral',
        title: 'Régimes & Protocoles',
        desc: 'Suivez un protocole Low-FODMAP personnalisé en 3 phases pour identifier vos intolérances alimentaires.',
    },
    {
        href: '/cooking/pantry',
        icon: '🥫',
        iconBg: 'icon-bg-sage',
        cardClass: 'card-sage',
        arrowClass: 'arrow-sage',
        title: 'Mon Cellier',
        desc: 'Gérez vos ingrédients en stock et trouvez des recettes basées sur ce que vous avez déjà.',
    },
    {
        href: '/cooking/recipes',
        icon: '🍲',
        iconBg: 'icon-bg-lavender',
        cardClass: 'card-lavender',
        arrowClass: 'arrow-lavender',
        title: 'Idées de Recettes',
        desc: 'Découvrez des recettes délicieuses adaptées à votre régime et à vos ingrédients disponibles.',
    },
    {
        href: '/cooking/shopping',
        icon: '🛒',
        iconBg: 'icon-bg-orange',
        cardClass: 'card-orange',
        arrowClass: 'arrow-orange',
        title: 'Liste de Courses',
        desc: 'Générez automatiquement votre liste de courses à partir de vos recettes sélectionnées.',
    },
    {
        href: '/cooking/mealprep',
        icon: '🍱',
        iconBg: 'icon-bg-rose',
        cardClass: 'card-rose',
        arrowClass: 'arrow-rose',
        title: 'Meal Prep',
        desc: 'Planifiez vos repas de la semaine et organisez vos sessions de préparation en avance.',
    },
];

export default function CookingLandingPage() {
    return (
        <>
            {/* ── Hero Section ── */}
            <section className="ck-hero">
                <div className="ck-hero-badge">
                    <span>✨</span>
                    Votre compagnon culinaire intelligent
                </div>

                <h1>
                    Cuisinez avec<br />
                    <span>confiance & plaisir</span>
                </h1>

                <p className="ck-hero-subtitle">
                    Découvrez vos intolérances, explorez des recettes adaptées,
                    gérez votre cellier et planifiez vos repas — le tout dans une
                    application pensée pour vous.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/cooking/protocols" className="ck-btn ck-btn-primary">
                        🥦 Commencer un protocole
                    </Link>
                    <Link href="/cooking/recipes" className="ck-btn ck-btn-secondary">
                        🍲 Explorer les recettes
                    </Link>
                </div>
            </section>

            {/* ── Quick Stats ── */}
            <div className="ck-glass-section">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div className="ck-stat-card ck-fade-up-1">
                        <div className="ck-stat-value" style={{ color: 'var(--ck-coral)' }}>🍎</div>
                        <div className="ck-stat-value" style={{ color: 'var(--ck-coral)', fontSize: '1.5rem' }}>156</div>
                        <div className="ck-stat-label">Recettes</div>
                    </div>
                    <div className="ck-stat-card ck-fade-up-2">
                        <div className="ck-stat-value" style={{ color: 'var(--ck-sage)' }}>🥬</div>
                        <div className="ck-stat-value" style={{ color: 'var(--ck-sage)', fontSize: '1.5rem' }}>24</div>
                        <div className="ck-stat-label">Ingrédients</div>
                    </div>
                    <div className="ck-stat-card ck-fade-up-3">
                        <div className="ck-stat-value" style={{ color: 'var(--ck-lavender)' }}>📋</div>
                        <div className="ck-stat-value" style={{ color: 'var(--ck-lavender)', fontSize: '1.5rem' }}>3</div>
                        <div className="ck-stat-label">Protocoles</div>
                    </div>
                    <div className="ck-stat-card ck-fade-up-4">
                        <div className="ck-stat-value" style={{ color: 'var(--ck-rose)' }}>🍱</div>
                        <div className="ck-stat-value" style={{ color: 'var(--ck-rose)', fontSize: '1.5rem' }}>7</div>
                        <div className="ck-stat-label">Preps / semaine</div>
                    </div>
                </div>
            </div>

            {/* ── Feature Cards ── */}
            <div className="ck-features-grid">
                {features.map((f, i) => (
                    <Link key={f.href} href={f.href} className={`ck-feature-card ${f.cardClass} ck-fade-up-${Math.min(i + 1, 5)}`}>
                        <div className={`ck-card-icon ${f.iconBg}`}>
                            {f.icon}
                        </div>
                        <h3 className="ck-card-title">{f.title}</h3>
                        <p className="ck-card-desc">{f.desc}</p>
                        <div className={`ck-card-arrow ${f.arrowClass}`}>
                            Découvrir <span>→</span>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}
