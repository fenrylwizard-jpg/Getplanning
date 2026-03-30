"use client";
import React, { useState } from 'react';
import { KeyRound, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setSubmitted(true);
                toast.success('Demande de réinitialisation enregistrée');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur lors de la demande');
            }
        } catch {
            toast.error('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="aurora-page relative flex items-center justify-center text-white overflow-hidden p-4">
                <div className="w-full max-w-[480px] relative z-10 glass-card bg-[#080d1a]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <ShieldCheck size={40} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">Demande Envoyée</h2>
                    <p className="text-gray-300 mb-2">Un administrateur a été notifié.</p>
                    <p className="text-gray-400 text-sm mb-8">Votre mot de passe sera réinitialisé et vous recevrez vos nouveaux accès sous peu.</p>
                    
                    <Link href="/login" className="inline-block w-full py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 uppercase tracking-wider hover:scale-[1.02] text-center">
                        Retour à la Connexion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="aurora-page relative flex items-center justify-center text-white overflow-hidden p-4">
            <div className="w-full max-w-[480px] relative z-10 glass-card bg-[#080d1a]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_2px_10px_rgba(255,255,255,0.05)] hover:border-cyan-500/30 transition-all duration-500">
                
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                        <KeyRound size={28} className="text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500">
                        Mot de Passe Oublié
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 text-center">Entrez votre adresse e-mail et un administrateur réinitialisera votre mot de passe.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <label htmlFor="resetEmail" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            <Mail size={12} className="inline mr-1" /> Adresse e-mail
                        </label>
                        <input
                            id="resetEmail"
                            type="email"
                            className="w-full bg-[#050810]/50 border border-white/10 text-white rounded-md py-4 pl-4 pr-4 outline-none transition-all duration-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 shadow-inner text-lg"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="votre@email.com"
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !email}
                        className="w-full py-4 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                    >
                        {loading ? 'Envoi en cours...' : 'Demander la Réinitialisation'}
                    </button>

                    <div className="text-center">
                        <Link href="/login" className="text-sm text-gray-400 hover:text-amber-400 transition-colors underline-offset-4 hover:underline flex items-center justify-center gap-2">
                            <ArrowLeft size={14} /> Retour à la Connexion
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
