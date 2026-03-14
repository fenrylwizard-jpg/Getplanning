'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SymptomEntry {
    id: number;
    date: string;            // ISO date string
    mealType: 'Petit-déj' | 'Déjeuner' | 'Dîner' | 'Collation';
    foodsEaten: string[];
    symptoms: {
        name: string;
        severity: 1 | 2 | 3 | 4 | 5;
        emoji: string;
    }[];
    overallFeeling: 1 | 2 | 3 | 4 | 5;  // 1=terrible, 5=great
    notes: string;
}

export interface CookingUser {
    username: string;
    displayName: string;
    protocol: 'low-fodmap' | 'none';
    protocolPhase: 1 | 2 | 3;
    mealPrepEnabled: boolean;
    pantryItems: PantryItem[];
    shoppingList: ShoppingItem[];
    symptomLog: SymptomEntry[];
}

export interface PantryItem {
    id: number;
    name: string;
    category: string;
    emoji: string;
    qty: string;
}

export interface ShoppingItem {
    id: number;
    name: string;
    emoji: string;
    category: string;
    checked: boolean;
}

interface CookingAuthContextType {
    user: CookingUser | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    updateUser: (updates: Partial<CookingUser>) => void;
}

const CookingAuthContext = createContext<CookingAuthContextType | null>(null);

const USERS_DB: Record<string, { password: string; profile: CookingUser }> = {
    victoria: {
        password: 'password',
        profile: {
            username: 'victoria',
            displayName: 'Victoria',
            protocol: 'low-fodmap',
            protocolPhase: 1,
            mealPrepEnabled: true,
            pantryItems: [
                { id: 1, name: 'Carottes', category: 'Légumes', emoji: '🥕', qty: '500g' },
                { id: 2, name: 'Courgettes', category: 'Légumes', emoji: '🥒', qty: '3 pièces' },
                { id: 3, name: 'Riz basmati', category: 'Céréales', emoji: '🍚', qty: '1 kg' },
                { id: 4, name: 'Poulet', category: 'Protéines', emoji: '🍗', qty: '800g' },
                { id: 5, name: 'Fraises', category: 'Fruits', emoji: '🍓', qty: '250g' },
                { id: 6, name: 'Parmesan', category: 'Produits laitiers', emoji: '🧀', qty: '200g' },
                { id: 7, name: 'Curcuma', category: 'Épices & condiments', emoji: '🌿', qty: '1 pot' },
                { id: 8, name: 'Saumon', category: 'Protéines', emoji: '🐟', qty: '400g' },
                { id: 9, name: 'Myrtilles', category: 'Fruits', emoji: '🫐', qty: '150g' },
                { id: 10, name: 'Quinoa', category: 'Céréales', emoji: '🌾', qty: '500g' },
            ],
            shoppingList: [
                { id: 1, name: 'Carottes bio (1 kg)', emoji: '🥕', category: 'Légumes', checked: false },
                { id: 2, name: 'Filets de poulet (600 g)', emoji: '🍗', category: 'Protéines', checked: false },
                { id: 3, name: 'Parmesan (200 g)', emoji: '🧀', category: 'Produits laitiers', checked: false },
                { id: 4, name: 'Citrons (4 pièces)', emoji: '🍋', category: 'Fruits', checked: true },
                { id: 5, name: 'Huile d\'olive', emoji: '🫒', category: 'Condiments', checked: false },
            ],
            symptomLog: [
                {
                    id: 1,
                    date: '2026-03-14T12:30:00',
                    mealType: 'Déjeuner',
                    foodsEaten: ['Risotto aux courgettes', 'Parmesan', 'Huile d\'olive'],
                    symptoms: [
                        { name: 'Ballonnements', severity: 2, emoji: '🫧' },
                    ],
                    overallFeeling: 4,
                    notes: 'Léger ballonnement 1h après le repas, rien de grave.',
                },
                {
                    id: 2,
                    date: '2026-03-13T19:00:00',
                    mealType: 'Dîner',
                    foodsEaten: ['Saumon grillé', 'Riz basmati', 'Carottes'],
                    symptoms: [],
                    overallFeeling: 5,
                    notes: 'Aucun symptôme ! Repas parfait.',
                },
                {
                    id: 3,
                    date: '2026-03-12T13:00:00',
                    mealType: 'Déjeuner',
                    foodsEaten: ['Salade de quinoa', 'Tomates', 'Oignon'],
                    symptoms: [
                        { name: 'Douleur abdominale', severity: 4, emoji: '😣' },
                        { name: 'Ballonnements', severity: 4, emoji: '🫧' },
                        { name: 'Nausée', severity: 2, emoji: '🤢' },
                    ],
                    overallFeeling: 2,
                    notes: 'Douleur forte après avoir mangé de l\'oignon — possible déclencheur FODMAP (fructanes).',
                },
            ],
        },
    },
};

const STORAGE_KEY = 'cooking-auth-user';

export function CookingAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CookingUser | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch { /* ignore */ }
        }
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (loaded) {
            if (user) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [user, loaded]);

    const login = (username: string, password: string): boolean => {
        const entry = USERS_DB[username.toLowerCase()];
        if (entry && entry.password === password) {
            setUser(entry.profile);
            return true;
        }
        return false;
    };

    const logout = () => setUser(null);

    const updateUser = (updates: Partial<CookingUser>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    if (!loaded) return null;

    return (
        <CookingAuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </CookingAuthContext.Provider>
    );
}

export function useCookingAuth() {
    const ctx = useContext(CookingAuthContext);
    if (!ctx) throw new Error('useCookingAuth must be inside CookingAuthProvider');
    return ctx;
}
