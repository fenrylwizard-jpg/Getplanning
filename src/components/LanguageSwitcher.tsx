"use client";

import React from "react";
import { useTranslation } from "@/lib/LanguageContext";

export default function LanguageSwitcher() {
    const { lang, setLang } = useTranslation();

    return (
        <div className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            {[
                { code: "fr", flag: "🇫🇷" },
                { code: "en", flag: "🇬🇧" },
                { code: "nl", flag: "🇳🇱" }
            ].map(l => (
                <button
                    key={l.code}
                    onClick={() => setLang(l.code as any)}
                    className={`flex items-center justify-center px-4 py-2 rounded-xl border transition-all active:scale-95 cursor-pointer hover:scale-[1.05] ${
                        lang === l.code 
                        ? "bg-purple-600 border-purple-400 text-white shadow-[0_4px_15px_rgba(147,51,234,0.4)]" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white"
                    }`}
                >
                    <span className="text-sm font-black uppercase tracking-wider">{l.code}</span>
                </button>
            ))}
        </div>
    );
}
