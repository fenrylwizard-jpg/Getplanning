"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calculator, Receipt, CheckCircle2 } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface FinancesTabProps {
    project: {
        id: string;
        name: string;
        tasks: { totalBudgetedHours: number | null; completedHours: number | null; hourlyRate: number | null }[];
    };
}

interface FinanceSnapshot {
    id: string;
    month: string;
    sheetName: string | null;
    totalRevenue: number | null;
    laborCost: number | null;
    externalLaborCost: number | null;
    subcontractorCost: number | null;
    materialCost: number | null;
    engineeringCost: number | null;
    siteCost: number | null;
    provisionsCost: number | null;
    totalCost: number | null;
    result: number | null;
    marginPercent: number | null;
}

const fmt = (val: number | null, decimals = 0) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(val);
};

const pct = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    return `${(val * 100).toFixed(1)}%`;
};

const monthName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

// Demo financial data (fallback)
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
    const [snapshots, setSnapshots] = useState<FinanceSnapshot[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = () => {
        if (!project?.id) return;
        setLoading(true);
        fetch(`/api/hub/finances?projectId=${project.id}`)
            .then(r => r.json())
            .then(d => {
                setSnapshots(d.snapshots || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [project?.id]);

    const isDemo = snapshots.length === 0;
    const latest = snapshots[snapshots.length - 1];

    // Cost breakdown for latest snapshot
    const costBreakdown = latest ? [
        { label: "Main d'oeuvre", value: latest.laborCost, color: '#3b82f6' },
        { label: 'Ingénierie', value: latest.engineeringCost, color: '#8b5cf6' },
        { label: 'Matériel', value: latest.materialCost, color: '#06b6d4' },
        { label: 'Sous-traitance', value: latest.subcontractorCost, color: '#f59e0b' },
        { label: 'Provisions', value: latest.provisionsCost, color: '#ef4444' },
        { label: 'Ext. Régie', value: latest.externalLaborCost, color: '#10b981' },
    ].filter(c => c.value && c.value !== 0) : [];
    const totalBreakdown = costBreakdown.reduce((s, c) => s + (c.value || 0), 0);

    // Chart: result evolution
    const maxResult = snapshots.length > 0 ? Math.max(...snapshots.map(s => Math.abs(s.result || 0)), 1) : 1;

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
                onUploadComplete={() => fetchData()}
            />

            {/* Data source indicator */}
            {isDemo ? (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-300">
                        <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                    </p>
                </div>
            ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-xs text-emerald-300 font-semibold">
                        Données importées actives — {snapshots.length} snapshot{snapshots.length > 1 ? 's' : ''} financier{snapshots.length > 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : isDemo ? (
                <>
                    {/* Demo view - keep the nice design but clearly marked as demo */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Budget Total", value: `${(DEMO_FINANCE.totalBudget / 1e6).toFixed(2)}M €`, icon: DollarSign, color: "purple" },
                            { label: "Dépensé", value: `${(DEMO_FINANCE.totalSpent / 1000).toFixed(0)}k €`, icon: TrendingDown, color: "red" },
                            { label: "Engagé", value: `${(DEMO_FINANCE.totalCommitted / 1e6).toFixed(2)}M €`, icon: Receipt, color: "blue" },
                            { label: "Marge", value: `${(DEMO_FINANCE.margin / 1000).toFixed(0)}k €`, icon: TrendingUp, color: "emerald" },
                        ].map(card => (
                            <div key={card.label} className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5 opacity-60">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${card.color}-500/20 border border-${card.color}-500/30 flex items-center justify-center`}>
                                        <card.icon size={18} className={`text-${card.color}-400`} />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">{card.label}</span>
                                </div>
                                <div className={`text-2xl font-black text-${card.color}-400`}>{card.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Demo monthly chart */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6 opacity-60">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <T k="hub_monthly_costs" />
                        </h3>
                        <div className="flex items-end gap-2 h-48">
                            {DEMO_FINANCE.monthlyCosts.map((month, idx) => {
                                const maxM = Math.max(...DEMO_FINANCE.monthlyCosts.flatMap(m => [m.budget, m.actual]));
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div className="flex gap-0.5 items-end w-full h-40">
                                            <div className="flex-1 bg-blue-500/20 border border-blue-500/20 rounded-t-sm" style={{ height: `${(month.budget / maxM) * 100}%` }} />
                                            <div className={`flex-1 rounded-t-sm ${month.actual > month.budget ? "bg-red-500/40 border border-red-500/30" : "bg-emerald-500/40 border border-emerald-500/30"}`}
                                                style={{ height: `${(month.actual / maxM) * 100}%` }} />
                                        </div>
                                        <span className="text-[7px] uppercase text-gray-500 font-bold">{month.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Real data KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {latest && [
                            { label: 'Revenu Total', value: fmt(latest.totalRevenue), icon: '💰', color: 'from-blue-500/20 to-blue-600/10' },
                            { label: 'Coût Total', value: fmt(latest.totalCost), icon: '💸', color: 'from-purple-500/20 to-purple-600/10' },
                            { label: 'Résultat', value: fmt(latest.result), icon: (latest.result || 0) >= 0 ? '📈' : '📉', color: (latest.result || 0) >= 0 ? 'from-emerald-500/20 to-emerald-600/10' : 'from-red-500/20 to-red-600/10' },
                            { label: 'Marge', value: pct(latest.marginPercent), icon: '🎯', color: (latest.marginPercent || 0) >= 0.05 ? 'from-cyan-500/20 to-cyan-600/10' : 'from-amber-500/20 to-amber-600/10' },
                        ].map(card => (
                            <div key={card.label} className={`bg-gradient-to-br ${card.color} backdrop-blur-sm rounded-xl border border-white/5 p-5`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{card.icon}</span>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                                </div>
                                <p className="text-white text-xl font-bold">{card.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Result Evolution Chart */}
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">📊 Évolution du Résultat</h3>
                            <div className="space-y-3">
                                {snapshots.map((snap, idx) => {
                                    const val = snap.result || 0;
                                    const width = Math.abs(val) / maxResult * 100;
                                    const isPositive = val >= 0;
                                    return (
                                        <div key={snap.id} className="flex items-center gap-3">
                                            <span className="text-gray-400 text-xs w-16 text-right font-mono">{monthName(snap.month)}</span>
                                            <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                                                <div className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                                                    style={{ width: `${Math.max(width, 3)}%`, animationDelay: `${idx * 100}ms` }} />
                                                <span className={`absolute inset-0 flex items-center px-3 text-xs font-semibold ${width > 40 ? 'text-white' : isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(val)}</span>
                                            </div>
                                            <span className={`text-xs font-medium w-12 text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{pct(snap.marginPercent)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">🍩 Répartition des Coûts</h3>
                            {costBreakdown.length > 0 ? (
                                <div className="space-y-3">
                                    {costBreakdown.map(item => {
                                        const pctVal = totalBreakdown > 0 ? ((item.value || 0) / totalBreakdown * 100) : 0;
                                        return (
                                            <div key={item.label} className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="text-gray-300 text-sm">{item.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-400 text-xs">{pctVal.toFixed(0)}%</span>
                                                        <span className="text-white text-sm font-mono font-medium w-28 text-right">{fmt(item.value)}</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${pctVal}%`, backgroundColor: item.color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Pas de données</p>
                            )}
                        </div>
                    </div>

                    {/* Monthly Comparison Table */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <span>📅</span> Évolution Mensuelle
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase">Mois</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Revenu</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Main d&apos;oeuvre</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Matériel</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Résultat</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase">Marge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {snapshots.map(snap => (
                                        <tr key={snap.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-white font-medium">{snap.sheetName || monthName(snap.month)}</td>
                                            <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(snap.totalRevenue)}</td>
                                            <td className="px-4 py-3 text-right text-blue-300 font-mono text-xs">{fmt(snap.laborCost)}</td>
                                            <td className="px-4 py-3 text-right text-cyan-300 font-mono text-xs">{fmt(snap.materialCost)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-mono text-xs font-semibold ${(snap.result || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {fmt(snap.result)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-mono text-xs ${(snap.marginPercent || 0) >= 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {pct(snap.marginPercent)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
