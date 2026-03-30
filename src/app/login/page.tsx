"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Activity, Users, ClipboardCheck, Zap, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import changelog from '@/lib/changelog';

const inter = Inter({ subsets: ['latin'] });

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                setErrorMsg(data.error || 'Identifiants incorrects. Veuillez réessayer.');
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

    if (!mounted) return null;

    return (
        <div className={`min-h-screen bg-[#030303] text-white overflow-hidden relative selection:bg-cyan-500/30 ${inter.className}`}>
            
            {/* ── STUNNING ANIMATIONS & STYLES ── */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes float-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-30px, 40px) scale(0.9); }
                    66% { transform: translate(40px, -20px) scale(1.1); }
                }
                @keyframes grid-move {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50px); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-glow-1 {
                    animation: float-1 15s ease-in-out infinite;
                    background: radial-gradient(circle, rgba(43, 189, 238, 0.25) 0%, rgba(43, 189, 238, 0) 60%);
                }
                .animate-glow-2 {
                    animation: float-2 18s ease-in-out infinite;
                    background: radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(147, 51, 234, 0) 60%);
                }
                
                .perspective-grid {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                    transform: perspective(1000px) rotateX(60deg) scale(2);
                    transform-origin: top;
                    animation: grid-move 20s linear infinite;
                    mask-image: linear-gradient(to bottom, transparent, black, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent 10%, black 50%, transparent 90%);
                    z-index: 0;
                }

                .stagger-1 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.1s; }
                .stagger-2 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.2s; }
                .stagger-3 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.3s; }
                .stagger-4 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.4s; }
                .stagger-5 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.5s; }
                .stagger-6 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; animation-delay: 0.6s; }

                .ultra-glass {
                    background: rgba(15, 15, 20, 0.4);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
                
                .text-gradient-cyan {
                    background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .text-gradient-purple {
                    background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                
                .btn-epic {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    background-size: 200% auto;
                    transition: 0.5s;
                }
                .btn-epic:hover:not(:disabled) {
                    background-position: right center;
                    box-shadow: 0 10px 30px -5px rgba(0, 242, 254, 0.5);
                    transform: translateY(-2px) scale(1.02);
                }
            `}} />

            {/* Background Orbs & Grid */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] animate-glow-1 rounded-full blur-[80px] opacity-70 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] animate-glow-2 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
            <div className="perspective-grid pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303] pointer-events-none z-0"></div>

            <main className="relative z-10 min-h-screen flex flex-col xl:flex-row w-full max-w-[1800px] mx-auto p-4 sm:p-8 md:p-12 lg:p-16 gap-12 lg:gap-24 items-center justify-center">
                
                {/* ── LEFT SIDE: BRANDING INTRO ── */}
                <section className="flex-1 w-full max-w-2xl xl:max-w-3xl flex flex-col justify-center stagger-1">
                    
                    {/* Logo Area */}
                    <div className="mb-6 lg:mb-10 inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)]">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                            Get<span className="text-gradient-cyan">Planning</span>
                        </h1>
                    </div>

                    {/* Headline */}
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400 stagger-2 drop-shadow-sm">
                        L'art de bâtir,<br/> maîtrisé.
                    </h2>
                    
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-medium leading-relaxed mb-12 stagger-3 max-w-xl">
                        La plateforme SaaS absolue pour le management de projets de construction. Planification chirurgicale et tracking terrain en temps réel.
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-4">
                        {[
                            { icon: Activity, title: "Analytics Avancées", color: "text-[#4facfe]", bg: "bg-[#4facfe]/10", border: "border-[#4facfe]/20" },
                            { icon: Users, title: "Gestion d'Équipe", color: "text-[#a18cd1]", bg: "bg-[#a18cd1]/10", border: "border-[#a18cd1]/20" },
                            { icon: ClipboardCheck, title: "Suivi Terrain", color: "text-[#4facfe]", bg: "bg-[#4facfe]/10", border: "border-[#4facfe]/20" },
                            { icon: Zap, title: "Automatisation", color: "text-[#a18cd1]", bg: "bg-[#a18cd1]/10", border: "border-[#a18cd1]/20" },
                        ].map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-4 group cursor-default">
                                <div className={`w-14 h-14 rounded-md ${feat.bg} flex items-center justify-center border ${feat.border} group-hover:scale-110 transition-transform duration-500`}>
                                    <feat.icon className={`w-6 h-6 ${feat.color}`} />
                                </div>
                                <span className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors">{feat.title}</span>
                            </div>
                        ))}
                    </div>

                    {/* Presentation Link */}
                    <div className="mt-16 stagger-5">
                        <a href="#" className="inline-flex items-center gap-2 px-8 py-4 rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-lg font-semibold text-white group backdrop-blur-md">
                            Découvrir la plateforme
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </section>


                {/* ── RIGHT SIDE: GLASS LOGIN CARD ── */}
                <section className="w-full max-w-md xl:max-w-lg shrink-0 stagger-6">
                    <div className="ultra-glass rounded-md p-8 sm:p-12 relative overflow-hidden group/card">
                        
                        {/* Shimmer Border Light */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                        {/* Top Icon Area */}
                        <div className="text-center mb-10 relative z-10">
                            <div className="mx-auto w-20 h-20 rounded-md bg-gradient-to-tr from-[#1e293b] to-[#334155] p-[2px] shadow-xl mb-6 shadow-[#00f2fe]/10">
                                <div className="w-full h-full rounded-md bg-[#0f0f14] flex items-center justify-center flex-col relative overflow-hidden">
                                     <Lock className="w-8 h-8 text-[#00f2fe] relative z-10" />
                                     <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#00f2fe]/20 blur-xl"></div>
                                </div>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Connexion</h2>
                            <p className="text-slate-400 font-medium">Accédez à votre espace de travail</p>
                        </div>

                        {errorMsg && (
                            <div className="mb-8 p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium flex items-center justify-center gap-3 backdrop-blur-sm animate-[fade-in-up_0.3s_ease]">
                                <span className="flex h-3 w-3 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                            {/* Email */}
                            <div className="space-y-2 group/input">
                                <label className="text-sm font-bold tracking-wider text-slate-300 uppercase ml-1" htmlFor="email">Email professionnel</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#00f2fe] transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input 
                                        className="block w-full pl-14 pr-4 py-4 text-base bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f2fe] focus:bg-white/10 transition-all" 
                                        id="email" 
                                        name="email" 
                                        placeholder="vous@entreprise.com" 
                                        required 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2 group/input">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-bold tracking-wider text-slate-300 uppercase" htmlFor="password">Mot de passe</label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#00f2fe] transition-colors">
                                        <KeyRound className="h-5 w-5" />
                                    </div>
                                    <input 
                                        className="block w-full pl-14 pr-4 py-4 text-base bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00f2fe] focus:bg-white/10 transition-all" 
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

                            <div className="flex items-center justify-end pt-1">
                                <Link href="/forgot-password" className="text-sm font-bold text-[#4facfe] hover:text-white transition-colors">
                                    Mot de passe oublié ?
                                </Link>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full btn-epic py-4 px-6 rounded-md text-white font-black uppercase tracking-wider text-xl disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <>Connexion...</>
                                ) : (
                                    <>Se Connecter <ArrowRight className="w-5 h-5 ml-1" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 text-center relative z-10">
                            <p className="text-slate-400 font-medium">
                                Nouveau sur GetPlanning ? 
                                <Link href="/register" className="ml-2 text-[#4facfe] font-bold hover:text-white transition-colors border-b border-transparent hover:border-[#4facfe] pb-1">
                                    Créer un compte
                                </Link>
                            </p>
                        </div>

                    </div>

                    {/* Changelog */}
                    <div className="mt-8 ultra-glass rounded-md p-6 relative overflow-hidden">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#4facfe] mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> Dernières mises à jour
                        </h3>
                        <div className="flex flex-col gap-4 max-h-[250px] overflow-y-auto pr-2">
                            {changelog.map((release) => (
                                <div key={release.version} className="border-l-2 border-[#4facfe]/30 pl-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-[#4facfe] bg-[#4facfe]/10 px-2 py-0.5 rounded-sm">v{release.version}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">{release.date}</span>
                                    </div>
                                    <ul className="space-y-0.5">
                                        {release.changes.map((c, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                                <span className="text-[#4facfe] mt-0.5">•</span> {c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
