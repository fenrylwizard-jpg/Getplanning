"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, KeyRound } from 'lucide-react';
import EEGLogo from '@/components/EEGLogo';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('pm@worksite.com'); // Autofill for convenience
    const [password, setPassword] = useState('password');
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

            {/* Floating Padlock Icon Background (Illusion of 3D) */}
            <div className="hidden lg:block absolute left-[20%] top-1/2 -translate-y-1/2 opacity-80 animate-pulse drop-shadow-[0_0_50px_rgba(19,200,236,0.6)]">
                <Lock size={120} className="text-cyan-400 stroke-[1.5]" />
            </div>

            <div className="w-full max-w-[440px] relative z-10 glass-card bg-[#080d1a]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_2px_10px_rgba(255,255,255,0.05)] hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(19,200,236,0.1)]">
                
                <div className="flex flex-col items-center mb-10">
                    <EEGLogo className="w-12 h-12 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(19,200,236,0.6)]" />
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
    );
}
