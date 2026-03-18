"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, BarChart3, Users, ClipboardCheck, Zap, Lock } from 'lucide-react';
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
        <div className="min-h-screen bg-[#050505] text-[#f8fafc] font-sans overflow-hidden relative selection:bg-[#2bbdee]/30">
            {/* Embedded styles for specific effects from Stitch */}
            <style dangerouslySetInnerHTML={{__html: `
                .glow-cyan {
                    position: absolute;
                    width: 50vw;
                    height: 50vw;
                    max-width: 600px;
                    max-height: 600px;
                    background: radial-gradient(circle, rgba(43, 189, 238, 0.15) 0%, rgba(43, 189, 238, 0) 70%);
                    filter: blur(60px);
                    z-index: 0;
                }
                .glow-purple {
                    position: absolute;
                    width: 60vw;
                    height: 60vw;
                    max-width: 700px;
                    max-height: 700px;
                    background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0) 70%);
                    filter: blur(80px);
                    z-index: 0;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .text-gradient {
                    background: linear-gradient(135deg, #2bbdee 0%, #9333ea 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .btn-gradient {
                    background: linear-gradient(135deg, #2bbdee 0%, #9333ea 100%);
                    transition: all 0.3s ease;
                }
                .btn-gradient:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px -5px rgba(43, 189, 238, 0.5);
                }
                .rounded-twelve {
                    border-radius: 12px;
                }
            `}} />

            {/* Atmospheric Background Elements */}
            <div className="glow-cyan -top-20 -left-20 pointer-events-none"></div>
            <div className="glow-purple bottom-0 right-0 pointer-events-none"></div>

            <main className="min-h-screen flex flex-col md:flex-row relative z-10">
                {/* ── LEFT SIDE: PRESENTATION ── */}
                <section className="flex-1 hidden md:flex flex-col justify-between p-12 lg:p-20 bg-[#0a0a0c]/40 relative border-r border-white/5">
                    
                    {/* Brand Logo */}
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                            <span className="text-gradient drop-shadow-sm">Get</span>Planning
                        </h1>
                    </div>

                    {/* Hero Content */}
                    <div className="max-w-xl xl:max-w-2xl mt-8">
                        <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] mb-8 text-white">
                            Plateforme SaaS de gestion de projet de construction.
                        </h2>
                        <p className="text-xl xl:text-2xl text-slate-300 font-medium leading-relaxed mb-16">
                            Planification, suivi terrain et analytics avancées pour les professionnels du bâtiment.
                        </p>

                        {/* Feature Rows */}
                        <div className="space-y-8">
                            <div className="flex items-center space-x-6 group">
                                <div className="w-14 h-14 rounded-twelve bg-[#2bbdee]/10 flex items-center justify-center border border-[#2bbdee]/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(43,189,238,0.15)]">
                                    <BarChart3 className="w-7 h-7 text-[#2bbdee]" />
                                </div>
                                <span className="text-xl md:text-2xl font-semibold text-slate-100 group-hover:text-white transition-colors">Analytics Avancées</span>
                            </div>
                            
                            <div className="flex items-center space-x-6 group">
                                <div className="w-14 h-14 rounded-twelve bg-[#9333ea]/10 flex items-center justify-center border border-[#9333ea]/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                                    <Users className="w-7 h-7 text-[#9333ea]" />
                                </div>
                                <span className="text-xl md:text-2xl font-semibold text-slate-100 group-hover:text-white transition-colors">Gestion des Équipes</span>
                            </div>
                            
                            <div className="flex items-center space-x-6 group">
                                <div className="w-14 h-14 rounded-twelve bg-[#2bbdee]/10 flex items-center justify-center border border-[#2bbdee]/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(43,189,238,0.15)]">
                                    <ClipboardCheck className="w-7 h-7 text-[#2bbdee]" />
                                </div>
                                <span className="text-xl md:text-2xl font-semibold text-slate-100 group-hover:text-white transition-colors">Suivi Terrain</span>
                            </div>
                            
                            <div className="flex items-center space-x-6 group">
                                <div className="w-14 h-14 rounded-twelve bg-[#9333ea]/10 flex items-center justify-center border border-[#9333ea]/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                                    <Zap className="w-7 h-7 text-[#9333ea]" />
                                </div>
                                <span className="text-xl md:text-2xl font-semibold text-slate-100 group-hover:text-white transition-colors">Automatisation</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-16">
                        <a 
                            className="text-xl font-bold text-[#2bbdee] hover:text-[#9333ea] transition-colors inline-flex items-center group" 
                            href="https://presentation.getplanning.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Voir la présentation complète 
                            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </a>
                    </div>
                </section>

                {/* ── RIGHT SIDE: LOGIN FORM ── */}
                <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20">
                    
                    {/* Mobile Logo Fallback */}
                    <div className="md:hidden mb-10 mt-6 text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            <span className="text-gradient">Get</span>Planning
                        </h1>
                    </div>

                    <div className="glass-card w-full max-w-[500px] rounded-twelve p-8 sm:p-12 relative overflow-visible shadow-2xl">
                        
                        {/* Form Header */}
                        <div className="text-center mb-12">
                            <div className="mx-auto inline-flex items-center justify-center w-20 h-20 rounded-twelve bg-[#2bbdee]/10 border border-[#2bbdee]/30 mb-8 shadow-[0_0_30px_rgba(43,189,238,0.2)]">
                                <Lock className="w-10 h-10 text-[#2bbdee]" />
                            </div>
                            <h2 className="text-4xl font-extrabold text-white mb-3">Connexion</h2>
                            <p className="text-lg text-slate-400">Heureux de vous revoir sur GetPlanning.</p>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 text-base text-center border border-red-500/30 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                {errorMsg}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-8">
                            
                            {/* Email Field */}
                            <div className="group">
                                <label className="block text-sm font-bold tracking-wide text-slate-300 mb-3 uppercase" htmlFor="email">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#2bbdee]">
                                        <Mail className="h-6 w-6 text-slate-500 group-focus-within:text-[#2bbdee] transition-colors" />
                                    </div>
                                    <input 
                                        className="block w-full pl-14 pr-4 py-4 text-lg bg-[#1e293b]/50 border border-slate-700 rounded-twelve text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2bbdee] focus:border-transparent transition-all shadow-inner" 
                                        id="email" 
                                        name="email" 
                                        placeholder="votre@email.com" 
                                        required 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="group">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-bold tracking-wide text-slate-300 uppercase" htmlFor="password">Mot de passe</label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-[#2bbdee]">
                                        <KeyRound className="h-6 w-6 text-slate-500 group-focus-within:text-[#2bbdee] transition-colors" />
                                    </div>
                                    <input 
                                        className="block w-full pl-14 pr-4 py-4 text-lg bg-[#1e293b]/50 border border-slate-700 rounded-twelve text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2bbdee] focus:border-transparent transition-all shadow-inner" 
                                        id="password" 
                                        name="password" 
                                        placeholder="••••••••" 
                                        required 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-2">
                                <Link className="text-sm font-medium text-[#2bbdee] hover:text-white transition-colors" href="/forgot-password">
                                    Mot de passe oublié ?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button 
                                className="w-full btn-gradient py-5 px-6 rounded-twelve text-white font-extrabold tracking-wide text-xl shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed uppercase" 
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Connexion en cours...' : 'Se Connecter'}
                            </button>
                        </form>

                        {/* Form Footer */}
                        <div className="mt-12 text-center">
                            <p className="text-slate-400 text-base">
                                Nouveau ici ? 
                                <Link className="text-[#2bbdee] font-bold hover:text-white transition-colors ml-2 inline-flex items-center group" href="/register">
                                    Créer un compte 
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
