"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, HardHat, Briefcase, Calculator, Receipt } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface FinancesTabProps {
    project: {
        id: string;
        name: string;
        tasks: { totalBudgetedHours: number | null; completedHours: number | null; hourlyRate: number | null }[];
    };
}

// Demo financial data
const DEMO_FINANCE = {
    totalBudget: 2450000,
    totalSpent: 862000,
    totalCommitted: 1320000,
    margin: 268000,
    etatsAvancement: [
        { period: "EA 01", amount: 185000, status: "paid" },
        { period: "EA 02", amount: 220000, status: "paid" },
        { period: "EA 03", amount: 195000, status: "submitted" },
        { period: "EA 04", amount: 262000, status: "pending" },
    ],
    manhours: {
        site: { budget: 4200, actual: 1850, label: "Main d'Œuvre Chantier" },
        pm: { budget: 800, actual: 420, label: "Chefs de Projet" },
        designers: { budget: 600, actual: 280, label: "Bureau d'Études" },
        engineers: { budget: 500, actual: 190, label: "Ingénieurs Projet" },
    },
    purchases: {
        committed: 785000,
        paid: 420000,
        pending: 365000,
    },
    monthlyCosts: [
        { month: "Sep 25", budget: 95000, actual: 82000 },
        { month: "Oct 25", budget: 120000, actual: 115000 },
        { month: "Nov 25", budget: 150000, actual: 162000 },
        { month: "Dec 25", budget: 140000, actual: 128000 },
        { month: "Jan 26", budget: 180000, actual: 175000 },
        { month: "Fév 26", budget: 195000, actual: 200000 },
        { month: "Mar 26", budget: 210000, actual: 0 },
    ],
};

const eaStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    paid: { label: "Payé", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    submitted: { label: "Soumis", color: "text-blue-400", bg: "bg-blue-500/10" },
    pending: { label: "En Préparation", color: "text-amber-400", bg: "bg-amber-500/10" },
};

export default function FinancesTab({ project }: FinancesTabProps) {
    const [showDemo] = useState(true);

    const d = DEMO_FINANCE;
    const burnRate = (d.totalSpent / d.totalBudget) * 100;
    const committedRate = (d.totalCommitted / d.totalBudget) * 100;
    const marginPct = (d.margin / d.totalBudget) * 100;
    const maxMonthly = Math.max(...d.monthlyCosts.flatMap(m => [m.budget, m.actual]));

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <FileUploadZone
                projectId={project.id}
                module="finances"
                acceptTypes=".xlsx,.xls"
                title="Importer les Données Financières"
                subtitle="Glissez un fichier Excel contenant le suivi financier du projet"
                accentColor="emerald"
                icon={<DollarSign size={36} className="text-emerald-400" />}
            />

            {showDemo && (
                <>
                    {/* Top-level Financial KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <DollarSign size={18} className="text-purple-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_total_budget" /></span>
                            </div>
                            <div className="text-2xl font-black text-white">{(d.totalBudget / 1e6).toFixed(2)}M €</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                    <TrendingDown size={18} className="text-red-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_total_spent" /></span>
                            </div>
                            <div className="text-2xl font-black text-red-400">{(d.totalSpent / 1000).toFixed(0)}k €</div>
                            <div className="text-[10px] text-gray-500 mt-1">{burnRate.toFixed(1)}% du budget</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                    <Receipt size={18} className="text-blue-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_committed" /></span>
                            </div>
                            <div className="text-2xl font-black text-blue-400">{(d.totalCommitted / 1e6).toFixed(2)}M €</div>
                            <div className="text-[10px] text-gray-500 mt-1">{committedRate.toFixed(1)}% du budget</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_margin" /></span>
                            </div>
                            <div className="text-2xl font-black text-emerald-400">{(d.margin / 1000).toFixed(0)}k €</div>
                            <div className="text-[10px] text-gray-500 mt-1">{marginPct.toFixed(1)}% marge</div>
                        </div>
                    </div>

                    {/* Budget Progress Bar */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4"><T k="hub_budget_usage" /></h3>
                        <div className="relative h-8 rounded-full bg-white/5 overflow-hidden">
                            <div className="absolute h-full bg-gradient-to-r from-red-500/80 to-orange-500/80 rounded-full" style={{ width: `${burnRate}%` }} />
                            <div className="absolute h-full border-r-2 border-dashed border-blue-400/50" style={{ left: `${committedRate}%` }} />
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] uppercase tracking-widest font-bold">
                            <span className="text-red-400">● <T k="hub_spent" /> {burnRate.toFixed(1)}%</span>
                            <span className="text-blue-400">⦿ <T k="hub_committed" /> {committedRate.toFixed(1)}%</span>
                            <span className="text-emerald-400">● <T k="hub_remaining" /> {(100 - committedRate).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Two-column: États d'Avancement + Monthly Costs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* États d'Avancement */}
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <Calculator size={16} className="text-purple-400" />
                                <T k="hub_etats_avancement" />
                            </h3>
                            <div className="flex flex-col gap-3">
                                {d.etatsAvancement.map((ea, idx) => {
                                    const config = eaStatusConfig[ea.status];
                                    const cumAmount = d.etatsAvancement.slice(0, idx + 1).reduce((s, e) => s + e.amount, 0);
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-3.5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-white">{ea.period}</span>
                                                <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-white">{ea.amount.toLocaleString()} €</div>
                                                <div className="text-[9px] text-gray-500">Cum. {cumAmount.toLocaleString()} €</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Monthly Cost Chart */}
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-emerald-400" />
                                <T k="hub_monthly_costs" />
                            </h3>
                            <div className="flex items-end gap-2 h-48">
                                {d.monthlyCosts.map((month, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div className="flex gap-0.5 items-end w-full h-40">
                                            {/* Budget bar */}
                                            <div
                                                className="flex-1 bg-blue-500/20 border border-blue-500/20 rounded-t-sm transition-all group-hover:bg-blue-500/30"
                                                style={{ height: `${(month.budget / maxMonthly) * 100}%` }}
                                            />
                                            {/* Actual bar */}
                                            <div
                                                className={`flex-1 rounded-t-sm transition-all ${month.actual > month.budget ? "bg-red-500/40 border border-red-500/30" : "bg-emerald-500/40 border border-emerald-500/30"}`}
                                                style={{ height: `${(month.actual / maxMonthly) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[7px] uppercase text-gray-500 font-bold">{month.month}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 mt-3 text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-blue-400">● Budget</span>
                                <span className="text-emerald-400">● Réel</span>
                            </div>
                        </div>
                    </div>

                    {/* Manhours Breakdown */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Clock size={16} className="text-cyan-400" />
                            <T k="hub_manhours_breakdown" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(d.manhours).map(([key, mh]) => {
                                const pct = (mh.actual / mh.budget) * 100;
                                const icons: Record<string, typeof HardHat> = { site: HardHat, pm: Briefcase, designers: Calculator, engineers: Users };
                                const Icon = icons[key] || Users;
                                return (
                                    <div key={key} className="bg-white/5 border border-white/5 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Icon size={14} className="text-cyan-400" />
                                            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">{mh.label}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-xl font-black text-white">{mh.actual.toLocaleString()}</span>
                                            <span className="text-xs text-gray-500">/ {mh.budget.toLocaleString()} h</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-cyan-500"}`}
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-[9px] text-gray-500 mt-1">{pct.toFixed(0)}% utilisé</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Demo notice */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-emerald-300">
                            <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
