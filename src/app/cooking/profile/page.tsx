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
            <div className="ck-glass-section" style={{ paddingTop: '4rem' }}>
                <div className="ck-empty-state">
                    <div className="ck-empty-state-icon">🔐</div>
                    <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Connexion requise</h3>
                    <p style={{ color: 'var(--ck-text-muted)', marginBottom: '1.5rem' }}>
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
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
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
                <h2 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.3rem' }}>🥗 Régimes & Protocoles</h2>
                <p style={{ color: 'var(--ck-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Sélectionnez vos contraintes et objectifs diététiques (plusieurs choix possibles).
                </p>
                
                <div className="ck-grid-auto" style={{ marginBottom: '3rem' }}>
                    {AVAILABLE_PROTOCOLS.map(proto => {
                        const isSelected = selectedProtocols.includes(proto.id);
                        return (
                            <div 
                                key={proto.id}
                                onClick={() => toggleProtocol(proto.id)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '1rem',
                                    border: isSelected ? '2px solid var(--ck-orange)' : '1px solid rgba(0,0,0,0.08)',
                                    background: isSelected ? 'rgba(245, 138, 61, 0.05)' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: isSelected ? 'translateY(-2px)' : 'none',
                                    boxShadow: isSelected ? '0 4px 15px rgba(245, 138, 61, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{proto.emoji}</span>
                                    <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>{proto.name}</h3>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ck-text-muted)', paddingLeft: '2.25rem' }}>
                                    {proto.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <h2 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.3rem' }}>⚖️ Paramètres Physiques & Objectifs</h2>
                
                <div className="ck-grid-2" style={{ marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                            Poids (kg)
                        </label>
                        <input className="ck-input" type="number" placeholder="Ex: 70" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                            Taille (cm)
                        </label>
                        <input className="ck-input" type="number" placeholder="Ex: 175" value={height} onChange={e => setHeight(e.target.value)} />
                    </div>
                </div>

                <div className="ck-grid-2" style={{ marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                            Âge
                        </label>
                        <input className="ck-input" type="number" placeholder="Ex: 30" value={age} onChange={e => setAge(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                            Sexe biologique
                        </label>
                        <select className="ck-input" value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')}>
                            <option value="F">Femme</option>
                            <option value="M">Homme</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                        Niveau d'activité physique
                    </label>
                    <select className="ck-input" value={activity} onChange={e => setActivity(parseFloat(e.target.value) as 1.2 | 1.375 | 1.55 | 1.725 | 1.9)}>
                        <option value={1.2}>Sédentaire (Peu ou pas d&apos;exercice)</option>
                        <option value={1.375}>Léger (Exercice 1-3 fois/semaine)</option>
                        <option value={1.55}>Modéré (Exercice 3-5 fois/semaine)</option>
                        <option value={1.725}>Intense (Exercice 6-7 fois/semaine)</option>
                        <option value={1.9}>Très intense (Athlète / Travail physique dur)</option>
                    </select>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1.1rem' }}>🎯 Vos Objectifs</h3>
                    
                    <div className="ck-grid-2">
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                Poids cible (kg)
                            </label>
                            <input className="ck-input" type="number" placeholder="Ex: 65 (Optionnel)" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ck-text-muted)', marginBottom: '0.5rem' }}>
                                Durée visée (semaines)
                            </label>
                            <input className="ck-input" type="number" placeholder="Ex: 12" value={goalDurationWeeks} onChange={e => setGoalDurationWeeks(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1.1rem' }}>✨ Compagnon de Voyage</h3>
                    <p style={{ color: 'var(--ck-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
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
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '1rem',
                                        border: isSelected ? `2px solid ${fairy.color}` : '1px solid rgba(0,0,0,0.08)',
                                        background: isSelected ? `${fairy.color}15` : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        transform: isSelected ? 'translateY(-2px)' : 'none',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '0.5rem' }}>
                                        <Image
                                            src={`/cooking/fairies/${fairy.id}_fairy_1.png`}
                                            alt={fairy.name}
                                            fill
                                            unoptimized
                                            style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                    <h4 style={{ fontWeight: 800, margin: '0 0 0.25rem 0' }}>{fairy.name}</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--ck-text-muted)', margin: 0 }}>{fairy.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Calculation Result */}
                {kcalTarget && (
                    <div style={{ 
                        padding: '1.5rem', 
                        borderRadius: '1rem', 
                        background: 'linear-gradient(135deg, var(--ck-orange), var(--ck-peach))',
                        color: 'white',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 30px rgba(245, 138, 61, 0.3)'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginBottom: '0.25rem' }}>
                                Votre cible calorique journalière
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                Calculée selon le métabolisme de base (Mifflin-St Jeor) et vos objectifs.
                            </div>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                            {kcalTarget} <span style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.8 }}>kcal</span>
                        </div>
                    </div>
                )}

                <button 
                    className="ck-btn ck-btn-rose" 
                    onClick={handleSave}
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                >
                    💾 Sauvegarder mon profil
                </button>
            </div>

            {/* Save Toast */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 8px 30px rgba(34, 197, 94, 0.35)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    animation: 'ck-toast-in 0.4s ease-out',
                }}>
                    <span style={{ fontSize: '1.4rem' }}>✅</span>
                    Profil sauvegardé avec succès !
                </div>
            )}
            <style jsx>{`
                @keyframes ck-toast-in {
                    0% { opacity: 0; transform: translateX(-50%) translateY(1rem); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
        </div>
    );
}
