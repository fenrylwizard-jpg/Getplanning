"use client";

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#050a18] text-slate-200 font-sans flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-[150px] -left-[100px] w-[500px] h-[500px] rounded-full bg-cyan-400 blur-[150px] opacity-10" />
            <div className="absolute -bottom-[100px] -right-[100px] w-[400px] h-[400px] rounded-full bg-purple-500 blur-[150px] opacity-10" />

            <div className="relative z-10 max-w-[700px]">
                {/* Logo */}
                <div className="text-6xl font-black tracking-tighter mb-6 leading-tight">
                    <span className="bg-gradient-to-br from-cyan-400 to-purple-500 bg-clip-text text-transparent">Get</span>Planning
                </div>

                <p className="text-xl text-white/45 leading-relaxed max-w-[500px] mx-auto mb-12">
                    Plateforme SaaS de gestion de projet de construction.<br />
                    Planification, suivi terrain et analytics avancées.
                </p>

                <div className="flex gap-6 justify-center flex-wrap">
                    <Link
                        href="https://app.getplanning.org"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-black font-extrabold text-base decoration-transparent transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                    >
                        Accéder à l&apos;application →
                    </Link>
                    <Link
                        href="https://presentation.getplanning.org"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-200 font-bold text-base transition-all duration-300 hover:bg-white/10"
                    >
                        Voir la présentation
                    </Link>
                </div>

                <p className="mt-20 text-xs text-white/15">
                    © 2026 GetPlanning.org — Tous droits réservés
                </p>
            </div>
        </div>
    );
}
