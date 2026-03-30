'use client';

import React, { useState, useEffect } from 'react';
import { useCookingAuth } from '../CookingAuthContext';
import Link from 'next/link';
import Image from 'next/image';

const AVAILABLE_PROTOCOLS = [
    { id: 'low-fodmap', name: 'Low-FODMAP', emoji: '🥦', desc: 'Syndrome de l\'Intestin Irritable (SII)' },
    { id: 'perte-de-poids', name: 'Perte de Poids', emoji: '⚖️', desc: 'Déficit calorique contrôlé' },
    { id: 'sans-gluten', name: 'Sans Gluten', emoji: '🌾', desc: 'Maladie cœliaque ou sensibilité' },
    { id: 'sans-lactose', name: 'Sans Lactose', emoji: '🥛', desc: 'Intolérance au lactose' },
    { id: 'vegetarien', name: 'Végétarien', emoji: '🥗', desc: 'Sans viande ni poisson' },
    { id: 'vegan', name: 'Végan', emoji: '🌱', desc: '100% végétal' },
    { id: 'keto', name: 'Cétogène (Keto)', emoji: '🥑', desc: 'Très faible en glucides, riche en lipides' },
    { id: 'mediterraneen', name: 'Méditerranéen', emoji: '🫒', desc: 'Équilibré, riche en bonnes graisses' },
    { id: 'diabetique', name: 'Anti-Diabète', emoji: '📉', desc: 'Faible indice glycémique' },
    { id: 'hyperproteine', name: 'Hyperprotéiné', emoji: '💪', desc: 'Prise de masse musculaire' },
];

export default function ProfilePage() {
    const { user, updateUser } = useCookingAuth();
    const [mounted, setMounted] = useState(false);
    const seeded = React.useRef(false);
    
    // State for multiple protocols
    const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
    
    // Gamification
    const [selectedFairy, setSelectedFairy] = useState<'fire' | 'water' | 'nature' | undefined>();
    
    // Personal Params State
    const [weight, setWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [gender, setGender] = useState<'M' | 'F'>('F');
    const [activity, setActivity] = useState<1.2 | 1.375 | 1.55 | 1.725 | 1.9>(1.2);
    const [goalWeight, setGoalWeight] = useState<string>('');
    const [goalDurationWeeks, setGoalDurationWeeks] = useState<string>('12'); // weeks

    // Toast state
    const [showToast, setShowToast] = useState(false);

    // Only seed form state ONCE on initial mount (not on every user change)
    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
            if (user && !seeded.current) {
                seeded.current = true;
                setSelectedProtocols(user.protocols || []);
                setSelectedFairy(user.selectedFairy);
                if (user.personalParams) {
                    setWeight(user.personalParams.weight?.toString() || '');
                    setHeight(user.personalParams.height?.toString() || '');
                    setAge(user.personalParams.age?.toString() || '');
                    setGender(user.personalParams.gender || 'F');
                    setActivity(user.personalParams.activityLevel || 1.2);
                    setGoalWeight(user.personalParams.goalWeight?.toString() || '');
                    setGoalDurationWeeks(user.personalParams.goalDurationWeeks?.toString() || user.personalParams.goalDuration?.toString() || '12');
                }
            }
        }, 0);
    }, [user]);

    if (!user || !mounted) {
        return (
            <div className="ck-glass-section ck-pt-4">
                <div className="ck-empty-state">
                    <div className="ck-empty-state-icon">🔐</div>
                    <h3 className="ck-login-title">Connexion requise</h3>
                    <p className="ck-login-desc">
                        Connectez-vous pour accéder à votre profil.
                    </p>
                    <Link href="/cooking/login" className="ck-btn ck-btn-primary">🍴 Se connecter</Link>
                </div>
            </div>
        );
    }

    const toggleProtocol = (id: string) => {
        if (selectedProtocols.includes(id)) {
            setSelectedProtocols(prev => prev.filter(p => p !== id));
        } else {
            setSelectedProtocols(prev => [...prev, id]);
        }
    };

    const calculateDailyKcal = (): number | undefined => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseInt(age);
        
        if (!w || !h || !a) return undefined;

        // Mifflin-St Jeor Equation for BMR
        let bmr = 10 * w + 6.25 * h - 5 * a;
        bmr += gender === 'M' ? 5 : -161;

        // Activity Multiplier
        const maintenance = bmr * activity;

        // Adjust for goal if set
        const gw = parseFloat(goalWeight);
        const duration = parseInt(goalDurationWeeks);
        
        if (gw && duration && gw < w) {
            // Simple logic: 7700 kcal per kg of body fat.
            const kgToLose = w - gw;
            const totalKcalDeficit = kgToLose * 7700;
            const daysToLose = duration * 7;
            const dailyDeficit = totalKcalDeficit / daysToLose;
            
            // Limit deficit to 1000 kcal/day for safety, and never go below 1200 kcal
            const safeDeficit = Math.min(dailyDeficit, 1000);
            return Math.max(Math.round(maintenance - safeDeficit), 1200);
        } else if (gw && duration && gw > w) {
             // Weight gain
             const kgToGain = gw - w;
             const totalKcalSurplus = kgToGain * 7700;
             const daysToGain = duration * 7;
             const dailySurplus = totalKcalSurplus / daysToGain;
             return Math.round(maintenance + Math.min(dailySurplus, 500)); // Cap surplus at 500
        }

        return Math.round(maintenance); // Maintain weight
    };

    const handleSave = () => {
        const dailyKcalTarget = calculateDailyKcal();
        
        updateUser({
            selectedFairy,
            protocols: selectedProtocols,
            personalParams: {
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
                age: age ? parseInt(age) : undefined,
                gender,
                activityLevel: activity,
                goalWeight: goalWeight ? parseFloat(goalWeight) : undefined,
                goalDurationWeeks: goalDurationWeeks ? parseInt(goalDurationWeeks) : undefined,
                dailyKcalTarget
            }
        });
        
        // Show animated toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const kcalTarget = calculateDailyKcal();

    return (
        <div className="ck-page-wrap">
            <div className="ck-page-header">
                <div className="ck-hero-badge ck-fade-up">
                    <span>👤</span> Mon Profil Santé
                </div>
                <h1 className="ck-fade-up-1">
                    Personnalisation
                </h1>
                <p className="ck-fade-up-2">
                    Définissez vos régimes et paramètres physiques pour un accompagnement sur-mesure.
                </p>
            </div>

            <div className="ck-glass-section ck-fade-up-2">
                <h2 className="ck-section-title">🥗 Régimes &amp; Protocoles</h2>
                <p className="ck-section-sub">
                    Sélectionnez vos contraintes et objectifs diététiques (plusieurs choix possibles).
                </p>
                
                <div className="ck-grid-auto ck-mb-3">
                    {AVAILABLE_PROTOCOLS.map(proto => {
                        const isSelected = selectedProtocols.includes(proto.id);
                        return (
                            <div 
                                key={proto.id}
                                onClick={() => toggleProtocol(proto.id)}
                                className={`ck-toggle-card${isSelected ? ' selected' : ''}`}
                            >
                                <div className="ck-toggle-card-header">
                                    <span className="ck-toggle-card-emoji">{proto.emoji}</span>
                                    <h3 className="ck-toggle-card-title">{proto.name}</h3>
                                </div>
                                <div className="ck-toggle-card-desc">
                                    {proto.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <h2 className="ck-section-title">⚖️ Paramètres Physiques &amp; Objectifs</h2>
                
                <div className="ck-grid-2 ck-mb-xl">
                    <div>
                        <label className="ck-field-label">
                            Poids (kg)
                        </label>
                        <input className="ck-input" type="number" placeholder="Ex: 70" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                    <div>
                        <label className="ck-field-label">
                            Taille (cm)
                        </label>
                        <input className="ck-input" type="number" placeholder="Ex: 175" value={height} onChange={e => setHeight(e.target.value)} />
                    </div>
                </div>

                <div className="ck-grid-2 ck-mb-xl">
                    <div>
                        <label className="ck-field-label">
                            Âge
                        </label>
                        <input className="ck-input" type="number" placeholder="Ex: 30" value={age} onChange={e => setAge(e.target.value)} />
                    </div>
                    <div>
                        <label className="ck-field-label">
                            Sexe biologique
                        </label>
                        <select className="ck-input" value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')} title="Sexe biologique">
                            <option value="F">Femme</option>
                            <option value="M">Homme</option>
                        </select>
                    </div>
                </div>

                <div className="ck-mb-xl">
                    <label className="ck-field-label">
                        Niveau d&apos;activité physique
                    </label>
                    <select className="ck-input" value={activity} onChange={e => setActivity(parseFloat(e.target.value) as 1.2 | 1.375 | 1.55 | 1.725 | 1.9)} title="Niveau d'activité physique">
                        <option value={1.2}>Sédentaire (Peu ou pas d&apos;exercice)</option>
                        <option value={1.375}>Léger (Exercice 1-3 fois/semaine)</option>
                        <option value={1.55}>Modéré (Exercice 3-5 fois/semaine)</option>
                        <option value={1.725}>Intense (Exercice 6-7 fois/semaine)</option>
                        <option value={1.9}>Très intense (Athlète / Travail physique dur)</option>
                    </select>
                </div>

                <div className="ck-inset-section">
                    <h3 className="ck-subsection-title">🎯 Vos Objectifs</h3>
                    
                    <div className="ck-grid-2">
                        <div>
                            <label className="ck-field-label">
                                Poids cible (kg)
                            </label>
                            <input className="ck-input" type="number" placeholder="Ex: 65 (Optionnel)" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
                        </div>
                        <div>
                            <label className="ck-field-label">
                                Durée visée (semaines)
                            </label>
                            <input className="ck-input" type="number" placeholder="Ex: 12" value={goalDurationWeeks} onChange={e => setGoalDurationWeeks(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="ck-inset-section">
                    <h3 className="ck-subsection-title">✨ Compagnon de Voyage</h3>
                    <p className="ck-section-sub">
                        Choisissez la fée élémentaire qui vous accompagnera. Elle évoluera au fur et à mesure que vous atteignez vos objectifs !
                    </p>
                    
                    <div className="ck-grid-3">
                        {[
                            { id: 'fire', name: 'Ignis', emoji: '🔥', desc: 'Fée du Feu', color: 'var(--ck-orange)' },
                            { id: 'water', name: 'Aqua', emoji: '💧', desc: "Fée de l'Eau", color: '#3b82f6' },
                            { id: 'nature', name: 'Terra', emoji: '🌿', desc: 'Fée de la Nature', color: '#10b981' }
                        ].map(fairy => {
                            const isSelected = selectedFairy === fairy.id;
                            return (
                                <div 
                                    key={fairy.id}
                                    onClick={() => setSelectedFairy(fairy.id as 'fire'|'water'|'nature')}
                                    className={`ck-fairy-card${isSelected ? ` selected selected-${fairy.id}` : ''}`}
                                >
                                    <div className="ck-fairy-img">
                                        <Image
                                            src={`/cooking/fairies/${fairy.id}_fairy_1.png`}
                                            alt={fairy.name}
                                            fill
                                            unoptimized
                                            className="ck-fairy-img-fit"
                                        />
                                    </div>
                                    <h4 className="ck-fairy-name">{fairy.name}</h4>
                                    <p className="ck-fairy-desc">{fairy.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Calculation Result */}
                {kcalTarget && (
                    <div className="ck-kcal-banner">
                        <div>
                            <div className="ck-kcal-label">
                                Votre cible calorique journalière
                            </div>
                            <div className="ck-kcal-sublabel">
                                Calculée selon le métabolisme de base (Mifflin-St Jeor) et vos objectifs.
                            </div>
                        </div>
                        <div className="ck-kcal-value">
                            {kcalTarget} <span className="ck-kcal-unit">kcal</span>
                        </div>
                    </div>
                )}

                <button 
                    className="ck-btn ck-btn-rose ck-save-btn-full" 
                    onClick={handleSave}
                >
                    💾 Sauvegarder mon profil
                </button>
            </div>

            {/* Save Toast */}
            {showToast && (
                <div className="ck-toast">
                    <span className="ck-toast-icon">✅</span>
                    Profil sauvegardé avec succès !
                </div>
            )}

        </div>
    );
}
