'use client';

import React, { useState, useEffect } from 'react';
import { useCookingAuth } from '../CookingAuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getFairyLevel, getFairyTier, getXpForNextLevel } from '../components/FloatingFairy';

type FairyType = 'fire' | 'water' | 'nature' | 'ice' | 'shadow';

const FAIRY_DATA: { id: FairyType; name: string; emoji: string; desc: string; color: string }[] = [
    { id: 'fire', name: 'Ignis', emoji: '🔥', desc: 'Fée du Feu', color: 'var(--ck-orange)' },
    { id: 'water', name: 'Aqua', emoji: '💧', desc: "Fée de l'Eau", color: '#3b82f6' },
    { id: 'nature', name: 'Terra', emoji: '🌿', desc: 'Fée de la Nature', color: '#10b981' },
    { id: 'ice', name: 'Cristal', emoji: '❄️', desc: 'Fée des Glaces', color: '#06b6d4' },
    { id: 'shadow', name: 'Umbra', emoji: '🌙', desc: 'Fée de l\'Ombre', color: '#8b5cf6' },
];

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
    const { user, updateUser, logout } = useCookingAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const seeded = React.useRef(false);
    
    // State for multiple protocols
    const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
    
    // Gamification
    const [selectedFairy, setSelectedFairy] = useState<FairyType | undefined>();
    
    // Personal Params State
    const [weight, setWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [gender, setGender] = useState<'M' | 'F'>('F');
    const [activity, setActivity] = useState<1.2 | 1.375 | 1.55 | 1.725 | 1.9>(1.2);
    const [goalWeight, setGoalWeight] = useState<string>('');
    const [goalDurationWeeks, setGoalDurationWeeks] = useState<string>('12'); // weeks

    // Protocol phase state
    const [protocolPhase, setProtocolPhase] = useState<1 | 2 | 3>(1);
    const [protocolStartDate, setProtocolStartDate] = useState<string>('');

    // Toast state
    const [showToast, setShowToast] = useState(false);

    // Fairy zoom state
    const [zoomedFairy, setZoomedFairy] = useState<{ src: string; name: string; tierLabel: string } | null>(null);

    // Only seed form state ONCE on initial mount (not on every user change)
    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
            if (user && !seeded.current) {
                seeded.current = true;
                setSelectedProtocols(user.protocols || []);
                setProtocolPhase(user.protocolPhase || 1);
                setProtocolStartDate(user.protocolStartDate || new Date().toISOString());
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
            protocolPhase,
            protocolStartDate,
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
            <div className="ck-page-header" style={{ position: 'relative' }}>
                <div className="ck-hero-badge ck-fade-up">
                    <span>👤</span> Mon Profil Santé
                </div>
                
                <h1 className="ck-fade-up-1">
                    {user.displayName || user.username}
                </h1>
                <p className="ck-fade-up-2">
                    Définissez vos régimes et paramètres physiques pour un accompagnement sur-mesure.
                </p>

                <button 
                    onClick={() => {
                        logout();
                        router.push('/cooking/login');
                    }}
                    className="ck-btn ck-btn-secondary"
                    style={{ position: 'absolute', top: 0, right: 0 }}
                >
                    🚪 Déconnexion
                </button>
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

                {/* FODMAP Tracking Section */}
                {selectedProtocols.includes('low-fodmap') && (
                    <div className="ck-inset-section" style={{ borderLeft: '4px solid var(--ck-orange)', background: 'rgba(245,138,61,0.03)' }}>
                        <h3 className="ck-subsection-title" style={{ color: 'var(--ck-orange)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🥦</span> Suivi du Protocole Low-FODMAP
                        </h3>
                        <p className="ck-section-sub">
                            Le régime FODMAP se déroule en 3 phases pour identifier vos intolérances sereinement.
                        </p>
                        
                        <div className="ck-mb-xl" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[1, 2, 3].map(phase => (
                                <button
                                    key={phase}
                                    onClick={() => setProtocolPhase(phase as 1|2|3)}
                                    className={`ck-btn ${protocolPhase === phase ? 'ck-btn-primary' : 'ck-btn-secondary'}`}
                                    style={{ flex: 1, minWidth: '140px', padding: '0.75rem 0.5rem' }}
                                >
                                    Phase {phase}
                                </button>
                            ))}
                        </div>

                        {protocolPhase === 1 && (
                            <div className="ck-fade-up">
                                <h4>Phase 1 : Élimination (2 à 6 semaines)</h4>
                                <p className="ck-text-sm ck-text-muted ck-mb-2">
                                    Éliminez complètement les FODMAPs de votre alimentation pour apaiser vos intestins.
                                </p>
                                <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '1rem', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                        <span>Début : {new Date(protocolStartDate).toLocaleDateString()}</span>
                                        <span>Objectif : 4 semaines</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        {/* Simple dummy progress bar, e.g. 50% */}
                                        <div style={{ width: '50%', height: '100%', background: 'var(--ck-orange)', borderRadius: '4px' }}></div>
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}>
                                        Gardez le cap ! Vos symptômes devraient commencer à diminuer.
                                    </p>
                                </div>
                            </div>
                        )}

                        {protocolPhase === 2 && (
                            <div className="ck-fade-up">
                                <h4>Phase 2 : Réintroduction (6 à 8 semaines)</h4>
                                <p className="ck-text-sm ck-text-muted ck-mb-2">
                                    Testez méthodiquement chaque famille de FODMAP (Lactose, Fructose, etc.) pour identifier vos déclencheurs.
                                </p>
                                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '1rem', padding: '1rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 600 }}>
                                        💡 Conseil : Utilisez le <strong>Journal</strong> pour noter précisément vos repas et ressentis lors de chaque test de groupe !
                                    </p>
                                </div>
                            </div>
                        )}

                        {protocolPhase === 3 && (
                            <div className="ck-fade-up">
                                <h4>Phase 3 : Personnalisation (À vie)</h4>
                                <p className="ck-text-sm ck-text-muted ck-mb-2">
                                    Vous connaissez maintenant vos tolérances. Mangez librement tout en gérant vos déclencheurs identifiés !
                                </p>
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <span style={{ fontSize: '2.5rem' }}>🎉</span>
                                    <p style={{ fontWeight: 800, marginTop: '0.5rem' }}>Félicitations pour ce parcours !</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                        Choisissez la fée élémentaire qui vous accompagnera. Elle évoluera au fur et à mesure que vous gagnez de l&apos;XP !
                    </p>
                    
                    <div className="ck-fairy-grid-5">
                        {FAIRY_DATA.map(fairy => {
                            const isSelected = selectedFairy === fairy.id;
                            return (
                                <div 
                                    key={fairy.id}
                                    onClick={() => setSelectedFairy(fairy.id)}
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
                                    
                                    {/* Evolution preview - show all 3 tiers */}
                                    {isSelected && (
                                        <div className="ck-fairy-evolutions">
                                            {[1, 2, 3].map(tier => {
                                                const tierLabel = tier === 1 ? 'Base' : tier === 2 ? 'Évo.' : 'Ultime';
                                                const imgSrc = `/cooking/fairies/${fairy.id}_fairy_${tier}.png`;
                                                return (
                                                    <div 
                                                        key={tier} 
                                                        className="ck-fairy-evo-slot unlocked"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setZoomedFairy({ src: imgSrc, name: fairy.name, tierLabel });
                                                        }}
                                                    >
                                                        <Image
                                                            src={imgSrc}
                                                            alt={`${fairy.name} Tier ${tier}`}
                                                            width={48}
                                                            height={48}
                                                            unoptimized
                                                            className="ck-fairy-evo-img"
                                                        />
                                                        <span className="ck-fairy-evo-label">
                                                            {tierLabel}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* XP Progress Bar */}
                {(() => {
                    const xp = user.fairyXp || 0;
                    const level = getFairyLevel(xp);
                    const tier = getFairyTier(level);
                    let currentLevelBaseXp = 0;
                    for (let i = 1; i < level; i++) { currentLevelBaseXp += getXpForNextLevel(i); }
                    const xpIntoLevel = xp - currentLevelBaseXp;
                    const xpNeeded = getXpForNextLevel(level);
                    const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100));
                    const tierName = tier === 1 ? 'Base' : tier === 2 ? 'Évoluée' : 'Ultime';

                    return (
                        <div className="ck-xp-section">
                            <h3 className="ck-subsection-title">⭐ Expérience</h3>
                            <div className="ck-xp-bar-wrap">
                                <div className="ck-xp-bar-header">
                                    <span className="ck-xp-level">Niveau {level}</span>
                                    <span className="ck-xp-tier">Forme : {tierName}</span>
                                </div>
                                <div className="ck-xp-bar-track">
                                    <div className="ck-xp-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                <div className="ck-xp-bar-footer">
                                    <span>{xpIntoLevel} / {xpNeeded} XP</span>
                                    <span>Total : {xp} XP</span>
                                </div>
                            </div>

                            <div className="ck-xp-explainer">
                                <h4>Comment gagner de l&apos;XP ?</h4>
                                <ul>
                                    <li>📋 <strong>Journal</strong> — Logguer un repas via &quot;Mange Moi&quot; → <em>+10 XP</em></li>
                                    <li>🍲 <strong>Découverte</strong> — Consulter une nouvelle recette → <em>+5 XP</em></li>
                                    <li>🥗 <strong>Régime</strong> — Compléter un objectif semaine → <em>+50 XP</em></li>
                                    <li>⭐ <strong>Streak</strong> — Jours consécutifs d&apos;utilisation → <em>+20 XP/jour</em></li>
                                </ul>
                                <div className="ck-xp-tiers-info">
                                    <p><strong>Paliers d&apos;évolution :</strong></p>
                                    <span className="ck-xp-tier-badge base">Niv. 1-10 → Forme Base</span>
                                    <span className="ck-xp-tier-badge evolved">Niv. 11-30 → Forme Évoluée</span>
                                    <span className="ck-xp-tier-badge ultimate">Niv. 31+ → Forme Ultime</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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

            {/* Fairy Zoom Overlay */}
            {zoomedFairy && (
                <div 
                    className="ck-fairy-zoom-overlay"
                    onClick={() => setZoomedFairy(null)}
                >
                    <div className="ck-fairy-zoom-img">
                        <Image
                            src={zoomedFairy.src}
                            alt={zoomedFairy.name}
                            fill
                            unoptimized
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <div className="ck-fairy-zoom-label">{zoomedFairy.name}</div>
                    <div className="ck-fairy-zoom-tier">{zoomedFairy.tierLabel}</div>
                </div>
            )}

        </div>
    );
}
