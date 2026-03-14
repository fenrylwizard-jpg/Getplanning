'use client';

import React, { useState, useEffect } from 'react';
import { useCookingAuth, PantryItem } from '../CookingAuthContext';
import Link from 'next/link';

const categories = [
    { name: 'Légumes', emoji: '🥬', color: 'var(--ck-sage)' },
    { name: 'Fruits', emoji: '🍎', color: 'var(--ck-coral)' },
    { name: 'Protéines', emoji: '🥩', color: 'var(--ck-orange)' },
    { name: 'Céréales', emoji: '🌾', color: 'var(--ck-peach-deep)' },
    { name: 'Produits laitiers', emoji: '🧀', color: 'var(--ck-lavender)' },
    { name: 'Épices & condiments', emoji: '🌿', color: 'var(--ck-teal)' },
];

export default function PantryPage() {
    const { user, updateUser } = useCookingAuth();
    const [items, setItems] = useState<PantryItem[]>([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');

    // Sync items with user profile
    useEffect(() => {
        if (user) {
            setItems(user.pantryItems);
        }
    }, [user]);

    // Persist changes back to user context
    const updateItems = (newItems: PantryItem[]) => {
        setItems(newItems);
        if (user) updateUser({ pantryItems: newItems });
    };

    const filtered = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = !activeCategory || item.category === activeCategory;
        return matchSearch && matchCategory;
    });

    const addItem = () => {
        if (!newItemName.trim()) return;
        const newItems = [...items, {
            id: Date.now(),
            name: newItemName,
            category: activeCategory || 'Légumes',
            emoji: '📦',
            qty: '—',
        }];
        updateItems(newItems);
        setNewItemName('');
    };

    const removeItem = (id: number) => {
        updateItems(items.filter(i => i.id !== id));
    };

    if (!user) {
        return (
            <div className="ck-glass-section" style={{ paddingTop: '4rem' }}>
                <div className="ck-empty-state">
                    <div className="ck-empty-state-icon">🔐</div>
                    <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Connexion requise</h3>
                    <p style={{ color: 'var(--ck-text-muted)', marginBottom: '1.5rem' }}>
                        Connectez-vous pour gérer votre cellier.
                    </p>
                    <Link href="/cooking/login" className="ck-btn ck-btn-primary">🍴 Se connecter</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up">
                    <span>🥫</span> Gestion du cellier
                </div>
                <h1 className="ck-fade-up-1">
                    Mon <span style={{ background: 'linear-gradient(135deg, var(--ck-sage), var(--ck-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cellier</span>
                </h1>
                <p className="ck-fade-up-2">
                    Ajoutez vos ingrédients en stock pour trouver des recettes adaptées à ce que vous avez.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* Search + Add */}
                <div className="ck-glass-card ck-fade-up-2" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <input
                            className="ck-input"
                            placeholder="🔍 Rechercher un ingrédient..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: '200px' }}
                        />
                        <input
                            className="ck-input"
                            placeholder="Ajouter un ingrédient..."
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem()}
                            style={{ flex: 1, minWidth: '200px' }}
                        />
                        <button className="ck-btn ck-btn-sage" onClick={addItem} title="Ajouter un ingrédient">
                            + Ajouter
                        </button>
                    </div>
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }} className="ck-fade-up-3">
                    <button
                        className={`ck-tag ${!activeCategory ? 'ck-tag-orange' : ''}`}
                        onClick={() => setActiveCategory(null)}
                        style={!activeCategory ? { background: 'var(--ck-orange)', color: 'white', borderColor: 'var(--ck-orange)' } : {
                            background: 'rgba(255,255,255,0.5)',
                            color: 'var(--ck-text-soft)',
                            borderColor: 'rgba(0,0,0,0.06)',
                        }}
                    >
                        Tout ({items.length})
                    </button>
                    {categories.map(cat => {
                        const count = items.filter(i => i.category === cat.name).length;
                        return (
                            <button
                                key={cat.name}
                                className="ck-tag"
                                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                                style={activeCategory === cat.name
                                    ? { background: cat.color, color: 'white', borderColor: cat.color }
                                    : { background: 'rgba(255,255,255,0.5)', color: 'var(--ck-text-soft)', borderColor: 'rgba(0,0,0,0.06)' }
                                }
                            >
                                {cat.emoji} {cat.name} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Items Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {filtered.map((item, i) => (
                        <div
                            key={item.id}
                            className="ck-list-item ck-fade-up"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <span style={{ fontSize: '1.75rem' }}>{item.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ck-text-muted)' }}>{item.qty} · {item.category}</div>
                            </div>
                            <button
                                onClick={() => removeItem(item.id)}
                                title={`Supprimer ${item.name}`}
                                style={{
                                    background: 'rgba(255, 107, 107, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.4rem 0.6rem',
                                    color: 'var(--ck-coral)',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="ck-empty-state">
                        <div className="ck-empty-state-icon">🥫</div>
                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Cellier vide</h3>
                        <p style={{ color: 'var(--ck-text-muted)' }}>Ajoutez des ingrédients pour commencer !</p>
                    </div>
                )}
            </div>
        </>
    );
}
