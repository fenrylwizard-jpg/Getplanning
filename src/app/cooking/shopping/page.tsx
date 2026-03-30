'use client';

import React, { useState } from 'react';

interface ShoppingItem {
    id: number;
    name: string;
    emoji: string;
    category: string;
    checked: boolean;
}

const initialItems: ShoppingItem[] = [
    { id: 1, name: 'Carottes bio (1 kg)', emoji: '🥕', category: 'Légumes', checked: false },
    { id: 2, name: 'Courgettes (3 pièces)', emoji: '🥒', category: 'Légumes', checked: false },
    { id: 3, name: 'Riz basmati (1 kg)', emoji: '🍚', category: 'Céréales', checked: true },
    { id: 4, name: 'Filets de poulet (600 g)', emoji: '🍗', category: 'Protéines', checked: false },
    { id: 5, name: 'Parmesan (200 g)', emoji: '🧀', category: 'Produits laitiers', checked: false },
    { id: 6, name: 'Citrons (4 pièces)', emoji: '🍋', category: 'Fruits', checked: true },
    { id: 7, name: 'Huile d\'olive extra vierge', emoji: '🫒', category: 'Condiments', checked: false },
    { id: 8, name: 'Saumon frais (500 g)', emoji: '🐟', category: 'Protéines', checked: false },
    { id: 9, name: 'Fraises (250 g)', emoji: '🍓', category: 'Fruits', checked: false },
    { id: 10, name: 'Quinoa (500 g)', emoji: '🌾', category: 'Céréales', checked: false },
    { id: 11, name: 'Gingembre frais', emoji: '🫚', category: 'Condiments', checked: true },
    { id: 12, name: 'Lait de coco (400 ml)', emoji: '🥥', category: 'Condiments', checked: false },
];

export default function ShoppingPage() {
    const [items, setItems] = useState(initialItems);
    const [newItemName, setNewItemName] = useState('');

    const toggleItem = (id: number) => {
        setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    };

    const addItem = () => {
        if (!newItemName.trim()) return;
        setItems([...items, {
            id: Date.now(),
            name: newItemName,
            emoji: '🛒',
            category: 'Autre',
            checked: false,
        }]);
        setNewItemName('');
    };

    const removeChecked = () => {
        setItems(items.filter(i => !i.checked));
    };

    const checked = items.filter(i => i.checked).length;
    const total = items.length;
    const progress = total > 0 ? (checked / total) * 100 : 0;

    // Group by category
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>);

    return (
        <>
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up">
                    <span>🛒</span> Liste intelligente
                </div>
                <h1 className="ck-fade-up-1">
                    Liste de{' '}
                    <span style={{ background: 'linear-gradient(135deg, var(--ck-orange), var(--ck-peach-deep))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Courses
                    </span>
                </h1>
                <p className="ck-fade-up-2">
                    Générée automatiquement à partir de vos recettes sélectionnées.
                </p>
            </div>

            <div className="ck-glass-section">
                {/* Progress Bar */}
                <div className="ck-glass-card ck-fade-up-2" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 800 }}>
                            {checked}/{total} articles achetés
                        </span>
                        <span style={{ fontWeight: 700, color: progress === 100 ? 'var(--ck-sage)' : 'var(--ck-orange)' }}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '9999px', background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            borderRadius: '9999px',
                            background: progress === 100
                                ? 'linear-gradient(90deg, var(--ck-sage), var(--ck-teal))'
                                : 'linear-gradient(90deg, var(--ck-orange), var(--ck-coral))',
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>

                {/* Add + Clear */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="ck-fade-up-3">
                    <input
                        className="ck-input"
                        placeholder="Ajouter un article..."
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <button className="ck-btn ck-btn-primary" onClick={addItem} title="Ajouter un article">+ Ajouter</button>
                    {checked > 0 && (
                        <button className="ck-btn ck-btn-secondary" onClick={removeChecked} title="Supprimer les articles achetés" style={{ color: 'var(--ck-coral)' }}>
                            🗑 Supprimer achetés
                        </button>
                    )}
                </div>

                {/* Grouped Items */}
                {Object.entries(grouped).map(([category, categoryItems]) => (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                            {category} ({categoryItems.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {categoryItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`ck-list-item ${item.checked ? 'checked' : ''}`}
                                    onClick={() => toggleItem(item.id)}
                                    style={{ cursor: 'pointer', opacity: item.checked ? 0.5 : 1, transition: 'all 0.3s ease' }}
                                >
                                    <div className={`ck-checkbox ${item.checked ? 'checked' : ''}`}>
                                        {item.checked && '✓'}
                                    </div>
                                    <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                                    <span style={{ fontWeight: 600, flex: 1, textDecoration: item.checked ? 'line-through' : 'none' }}>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
