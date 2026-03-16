'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PersonalParams {
    weight?: number;      // kg
    height?: number;      // cm
    age?: number;
    gender: 'M' | 'F';
    activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9; // Sedentary to Very Active
    goalWeight?: number;  // kg
    goalDuration?: number; // weeks (legacy)
    goalDurationWeeks?: number; // weeks
    dailyKcalTarget?: number; // Calculated field
}

export interface SymptomEntry {
    id: number;
    date: string;            // ISO date string
    mealType: 'Petit-déj' | 'Déjeuner' | 'Dîner' | 'Collation';
    foodsEaten: { name: string; kcal: number }[];
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
    protocols: string[]; // Support multiple diets (e.g. ['low-fodmap', 'perte-de-poids'])
    protocolPhase?: 1 | 2 | 3;
    personalParams?: PersonalParams;
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
            protocols: ['low-fodmap'],
            protocolPhase: 1,
            personalParams: {
                weight: 65,
                height: 168,
                age: 32,
                gender: 'F',
                activityLevel: 1.375,
                goalWeight: 60,
                goalDuration: 12,
                dailyKcalTarget: 1750,
            },
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
                    foodsEaten: [
                        { name: 'Risotto aux courgettes', kcal: 450 },
                        { name: 'Parmesan', kcal: 80 },
                        { name: 'Huile d\'olive', kcal: 90 }
                    ],
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
                    foodsEaten: [
                        { name: 'Saumon grillé', kcal: 320 },
                        { name: 'Riz basmati', kcal: 210 },
                        { name: 'Carottes', kcal: 45 }
                    ],
                    symptoms: [],
                    overallFeeling: 5,
                    notes: 'Aucun symptôme ! Repas parfait.',
                },
                {
                    id: 3,
                    date: '2026-03-12T13:00:00',
                    mealType: 'Déjeuner',
                    foodsEaten: [
                        { name: 'Salade de quinoa', kcal: 280 },
                        { name: 'Tomates', kcal: 25 },
                        { name: 'Oignon', kcal: 15 }
                    ],
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
const USERS_DB_STORAGE_KEY = 'cooking-users-db';

export function CookingAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CookingUser | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        // Initialize or load the persistent DB
        const storedDb = localStorage.getItem(USERS_DB_STORAGE_KEY);
        let currentDb = USERS_DB; 
        if (storedDb) {
            try {
                const parsedDb = JSON.parse(storedDb);
                currentDb = { ...USERS_DB, ...parsedDb };
            } catch { /* ignore */ }
        } else {
             localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(currentDb));
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && isMounted) {
            try {
                const parsed = JSON.parse(stored);
                // Normalize stale localStorage data — ensure all required fields exist
                const normalized: CookingUser = {
                    username: parsed.username || '',
                    displayName: parsed.displayName || parsed.username || '',
                    protocols: parsed.protocols ?? (parsed.protocol ? [parsed.protocol] : []),
                    protocolPhase: parsed.protocolPhase ?? 1,
                    personalParams: parsed.personalParams ?? undefined,
                    mealPrepEnabled: parsed.mealPrepEnabled ?? false,
                    pantryItems: parsed.pantryItems ?? [],
                    shoppingList: parsed.shoppingList ?? [],
                    symptomLog: parsed.symptomLog ?? [],
                };
                
                // Defer to avoid React cascading render warning
                setTimeout(() => {
                    setUser(normalized);
                }, 0);
            } catch { /* ignore */ }
        }
        if (isMounted) {
            setTimeout(() => {
                setLoaded(true);
            }, 0);
        }
        return () => { isMounted = false; };
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
        const storedDb = localStorage.getItem(USERS_DB_STORAGE_KEY);
        let currentDb = USERS_DB;
        if (storedDb) {
            try {
                currentDb = JSON.parse(storedDb);
            } catch { /* ignore */ }
        }

        const entry = currentDb[username.toLowerCase()];
        if (entry && entry.password === password) {
            setUser(entry.profile);
            return true;
        }
        return false;
    };

    const logout = () => setUser(null);

    const updateUser = (updates: Partial<CookingUser>) => {
        setUser(prev => {
            if (!prev) return null;
            const updatedProfile = { ...prev, ...updates };
            
            // Also update the persistent DB
            const storedDb = localStorage.getItem(USERS_DB_STORAGE_KEY);
            let currentDb = USERS_DB;
            if (storedDb) {
                try {
                    currentDb = JSON.parse(storedDb);
                } catch { /* ignore */ }
            }
            
            const usernameKey = updatedProfile.username.toLowerCase();
            currentDb[usernameKey] = {
                ...currentDb[usernameKey],
                profile: updatedProfile
            };
            
            localStorage.setItem(USERS_DB_STORAGE_KEY, JSON.stringify(currentDb));
            
            return updatedProfile;
        });
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
