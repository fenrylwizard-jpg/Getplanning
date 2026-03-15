"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Mail, Lock, Briefcase, Sparkles, Building2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const CHARACTERS = [
    { id: 1, name: "Maçon", role: "mason", color: "from-amber-500 to-orange-600", border: "border-amber-500", shadow: "shadow-amber-500/40" },
    { id: 2, name: "Électricien", role: "electrician", color: "from-cyan-400 to-blue-600", border: "border-cyan-500", shadow: "shadow-cyan-500/40" },
    { id: 3, name: "Menuisier", role: "carpenter", color: "from-emerald-400 to-green-600", border: "border-emerald-500", shadow: "shadow-emerald-500/40" },
    { id: 4, name: "Plombier", role: "plumber", color: "from-indigo-400 to-violet-600", border: "border-violet-500", shadow: "shadow-violet-500/40" },
    { id: 5, name: "Contremaître", role: "foreman", color: "from-rose-400 to-red-600", border: "border-rose-500", shadow: "shadow-rose-500/40" },
];

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('SM');
    const [characterId, setCharacterId] = useState(1);
    const [company, setCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg(false);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, characterId, company: company || undefined })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || 'Erreur lors de la création du compte');
                setLoading(false);
                return;
            }

            if (data.success) {
                setSuccessMsg(true);
                setName('');
                setEmail('');
                setPassword('');
            }

        } catch {
            setErrorMsg('Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    const selectedChar = CHARACTERS.find(c => c.id === characterId)!;

    if (successMsg) {
        return (
            <div className="aurora-page relative flex items-center justify-center text-white overflow-hidden p-4">
                <div className="w-full max-w-[480px] relative z-10 glass-card bg-[#080d1a]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <ShieldCheck size={40} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">Demande Envoyée !</h2>
                    <p className="text-gray-300 mb-2">Votre compte a été créé avec succès.</p>
                    <p className="text-gray-400 text-sm mb-8">Il est <strong className="text-emerald-400">en attente d&apos;approbation</strong> par un administrateur. Vous recevrez l&apos;accès une fois validé.</p>
                    
                    {/* Show selected character */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-24 h-24">
                            <Image src={`/characters/${selectedChar.role}_t0.png`} alt={selectedChar.name} fill unoptimized className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" style={{ background: 'transparent' }} />
                        </div>
                    </div>
                    
                    <button className="w-full py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 uppercase tracking-wider hover:scale-[1.02]" onClick={() => router.push('/login')}>
                        Retour à la Connexion
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="aurora-page relative flex items-center justify-center text-white overflow-hidden p-4 py-8">
            <div className="w-full max-w-[520px] relative z-10 glass-card bg-[#080d1a]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_2px_10px_rgba(255,255,255,0.05)] hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(19,200,236,0.1)]">
                
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20">
                        <Sparkles size={24} className="text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-500">
                        Créer un Compte
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Rejoignez la plateforme GetPlanning</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm text-center border border-red-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    {/* Name */}
                    <div className="relative group">
                        <label htmlFor="registerName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            <User size={12} className="inline mr-1" /> Nom Complet
                        </label>
                        <input
                            id="registerName"
                            type="text"
                            className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3 pl-4 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="ex: Jean Dupont"
                        />
                    </div>

                    {/* Company */}
                    <div className="relative group">
                        <label htmlFor="registerCompany" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            <Building2 size={12} className="inline mr-1" /> Entreprise
                        </label>
                        <input
                            id="registerCompany"
                            type="text"
                            className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3 pl-4 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="ex: Mon Entreprise SA"
                        />
                    </div>

                    {/* Email */}
                    <div className="relative group">
                        <label htmlFor="registerEmail" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            <Mail size={12} className="inline mr-1" /> Adresse e-mail
                        </label>
                        <input
                            id="registerEmail"
                            type="email"
                            className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3 pl-4 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="jean.dupont@chantier.com"
                        />
                    </div>

                    {/* Password + Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <label htmlFor="registerPassword" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                <Lock size={12} className="inline mr-1" /> Mot de passe
                            </label>
                            <input
                                id="registerPassword"
                                type="password"
                                className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3 pl-4 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="••••••"
                            />
                        </div>

                        <div className="relative group">
                            <label htmlFor="registerRole" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                <Briefcase size={12} className="inline mr-1" /> Rôle
                            </label>
                            <select 
                                id="registerRole"
                                className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3 pl-4 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner appearance-none"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                aria-label="Rôle Souhaité"
                            >
                                <option value="SM">Site Manager</option>
                                <option value="PM">Project Manager</option>
                            </select>
                        </div>
                    </div>

                    {/* ═══ Character Picker ═══ */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                            <Sparkles size={12} className="inline mr-1" /> Choisissez votre Personnage
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {CHARACTERS.map((char) => {
                                const isSelected = characterId === char.id;
                                return (
                                    <button
                                        key={char.id}
                                        type="button"
                                        onClick={() => setCharacterId(char.id)}
                                        className={`relative rounded-2xl p-1 transition-all duration-300 border-2 aspect-square flex flex-col items-center justify-center gap-1 group ${
                                            isSelected
                                                ? `${char.border} bg-transparent scale-110 ${char.shadow}`
                                                : 'border-transparent bg-transparent hover:border-white/20 hover:scale-105'
                                        }`}
                                        aria-label={`Sélectionner ${char.name}`}
                                    >
                                        <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                                            <Image 
                                                src={`/characters/${char.role}_t0.png`} 
                                                alt={char.name} 
                                                fill 
                                                unoptimized 
                                                className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" 
                                            />
                                        </div>
                                        <span className={`text-[9px] sm:text-[10px] font-bold leading-tight text-center transition-colors ${
                                            isSelected ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                                        }`}>
                                            {char.name}
                                        </span>
                                        {isSelected && (
                                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center shadow-lg`}>
                                                <span className="text-white text-[8px] font-black">✓</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                        >
                            {loading ? 'Création en cours...' : 'Soumettre la Demande'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-gray-400">Déjà un compte ?</span>{' '}
                        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline underline-offset-4 transition-colors font-medium">
                            Se Connecter
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
