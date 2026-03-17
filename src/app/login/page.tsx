"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, BarChart3, Users, ClipboardCheck, Zap } from 'lucide-react';

import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || 'Identifiants incorrects');
                setLoading(false);
                return;
            }

            if (data.success) {
                if (data.role === 'ADMIN') {
                    router.push('/admin/dashboard');
                } else if (data.role === 'PM') {
                    router.push('/pm/dashboard');
                } else {
                    router.push('/sm/dashboard');
                }
            }

        } catch {
            setErrorMsg('Erreur de connexion au serveur.');
            setLoading(false);
        }
    };

    return (
        <div className="aurora-page relative flex items-center justify-center text-white overflow-hidden p-4">

            <div className="w-full max-w-[1100px] relative z-10 flex flex-col lg:flex-row items-stretch gap-0 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                {/* ── LEFT: Presentation Side ── */}
                <div className="flex-1 bg-[#060c1e]/90 backdrop-blur-3xl p-8 sm:p-12 lg:p-14 flex flex-col justify-center border-r border-white/5">
                    <div className="mb-8">
                        <div className="text-4xl font-black tracking-tighter mb-3">
                            <span className="bg-gradient-to-br from-cyan-400 to-purple-500 bg-clip-text text-transparent">Get</span>Planning
                        </div>
                        <p className="text-white/40 text-base leading-relaxed max-w-[380px]">
                            Plateforme SaaS de gestion de projet de construction.
                            Planification, suivi terrain et analytics avancées.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {[
                            { icon: BarChart3, title: 'Analytics Avancées', desc: 'KPIs en temps réel et rapports de productivité', color: 'text-purple-400' },
                            { icon: Users, title: 'Gestion des Équipes', desc: 'Planning multi-semaines et allocation des ressources', color: 'text-teal-400' },
                            { icon: ClipboardCheck, title: 'Suivi Terrain', desc: 'Rapports journaliers et validation de conformité', color: 'text-indigo-400' },
                            { icon: Zap, title: 'Automatisation', desc: 'Alertes intelligentes et workflow automatisés', color: 'text-amber-400' },
                        ].map(({ icon: Icon, title, desc, color }) => (
                            <div key={title} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.1]">
                                <div className={`mt-0.5 ${color}`}>
                                    <Icon size={20} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{title}</p>
                                    <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <a
                        href="https://presentation.getplanning.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 inline-flex items-center gap-2 text-sm text-cyan-400/70 hover:text-cyan-300 transition-colors font-medium"
                    >
                        Voir la présentation complète →
                    </a>
                </div>

                {/* ── RIGHT: Login Form ── */}
                <div className="w-full lg:w-[420px] bg-[#080d1a]/90 backdrop-blur-3xl p-8 sm:p-12 flex flex-col justify-center">

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-2xl mb-6 drop-shadow-[0_0_15px_rgba(19,200,236,0.6)]">G</div>
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_10px_rgba(19,200,236,0.4)]">
                            Connexion
                        </h1>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm text-center border border-red-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <label htmlFor="emailInput" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="emailInput"
                                    type="email"
                                    className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label htmlFor="passwordInput" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                                    <KeyRound size={18} />
                                </div>
                                <input
                                    id="passwordInput"
                                    type="password"
                                    className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all duration-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col items-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                            >
                                {loading ? 'Connexion...' : 'Se Connecter'}
                            </button>

                            <Link href="/forgot-password" className="mt-8 text-sm text-gray-400 hover:text-cyan-400 transition-colors underline-offset-4 hover:underline">
                                Mot de passe oublié ?
                            </Link>

                            <Link href="/register" className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-4 hover:underline font-medium">
                                Créer un compte →
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
