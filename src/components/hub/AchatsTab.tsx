"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Truck, Package, DollarSign, Building2, TrendingUp, CheckCircle2 } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface AchatsTabProps {
    project?: { id: string };
}

interface PurchaseCategory {
    id: string;
    category: string;
    status: string | null;
    inProgress: boolean;
    offerPriceSoum: number | null;
    costPrice: number | null;
    supplierSoum: string | null;
    supplierExe: string | null;
    negotiatedPrice: number | null;
    returnAmount: number | null;
    comments: string | null;
}

// Demo data fallback
const DEMO_PURCHASES = [
    { category: "Ferraillage", supplier: "ArcelorMittal", amount: 185000, status: "delivered", description: "Acier et armatures" },
    { category: "Menuiseries Extérieures", supplier: "Schüco France", amount: 142000, status: "ordered", description: "Fenêtres et baies vitrées alu" },
    { category: "Béton Prêt à l'Emploi", supplier: "Holcim Belgium", amount: 96000, status: "delivered", description: "Béton C30/37 et C25/30" },
    { category: "Isolation Thermique", supplier: "Rockwool", amount: 78000, status: "ordered", description: "LDV + ITE" },
    { category: "Électricité Générale", supplier: "Legrand SA", amount: 65000, status: "pending", description: "Câblages, tableaux, prises" },
    { category: "Plomberie & Sanitaire", supplier: "Geberit", amount: 54000, status: "pending", description: "Tuyauterie, WC, lavabos" },
    { category: "Ascenseurs", supplier: "Otis", amount: 120000, status: "ordered", description: "2 ascenseurs hydrauliques" },
    { category: "Revêtement de Sol", supplier: "Tarkett SA", amount: 45000, status: "pending", description: "Carrelage et parquet" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    delivered: { label: "Livré", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    ordered: { label: "Commandé", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    pending: { label: "En Attente", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

const fmt = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
};

export default function AchatsTab({ project }: AchatsTabProps) {
    const [realData, setRealData] = useState<PurchaseCategory[] | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = () => {
        if (!project?.id) return;
        setLoading(true);
        fetch(`/api/hub/purchases?projectId=${project.id}`)
            .then(r => r.json())
            .then(d => {
                const cats = d.categories || [];
                setRealData(cats.length > 0 ? cats : null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [project?.id]);

    const isDemo = realData === null;

    // Build display data
    const displayData = isDemo
        ? DEMO_PURCHASES.map(p => ({
            category: p.category,
            supplierSoum: p.supplier,
            supplierExe: null as string | null,
            offerPriceSoum: p.amount,
            costPrice: null as number | null,
            negotiatedPrice: null as number | null,
            returnAmount: null as number | null,
            status: p.status,
            inProgress: p.status === 'ordered',
            comments: p.description,
        }))
        : realData;

    const totalBudget = displayData.reduce((s, c) => s + (c.offerPriceSoum || 0), 0);
    const totalCost = displayData.reduce((s, c) => s + (c.costPrice || 0), 0);
    const totalNegotiated = displayData.reduce((s, c) => s + (c.negotiatedPrice || 0), 0);
    const totalReturn = displayData.reduce((s, c) => s + (c.returnAmount || 0), 0);

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <FileUploadZone
                projectId={project?.id || ""}
                module="purchases"
                acceptTypes=".xlsx,.xls"
                title="Importer les Achats"
                subtitle="Glissez un fichier Excel contenant la liste des achats et fournisseurs du projet"
                accentColor="amber"
                icon={<ShoppingCart size={36} className="text-amber-400" />}
                onUploadComplete={() => fetchData()}
            />

            {/* Data source indicator */}
            {isDemo ? (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-4 text-center">
                    <p className="text-xs text-amber-300">
                        <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                    </p>
                </div>
            ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <p className="text-xs text-emerald-300 font-semibold">
                        Données importées actives — {displayData.length} catégorie{displayData.length > 1 ? 's' : ''} d&apos;achat chargée{displayData.length > 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-md p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <DollarSign size={18} className="text-purple-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_total_budget" /></span>
                            </div>
                            <div className="text-2xl font-black text-white">{fmt(totalBudget)}</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-md p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <Package size={18} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Coût Revient</span>
                            </div>
                            <div className="text-2xl font-black text-emerald-400">{fmt(totalCost)}</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-md p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                    <Truck size={18} className="text-blue-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Prix Négocié</span>
                            </div>
                            <div className="text-2xl font-black text-blue-400">{fmt(totalNegotiated)}</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-md p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-amber-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black">RETURN</span>
                            </div>
                            <div className={`text-2xl font-black ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(totalReturn)}</div>
                        </div>
                    </div>

                    {/* Purchase Table */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Catégorie</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Prix Soumission</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Coût Revient</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Fourn. SOUM</th>
                                        <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Fourn. EXE</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">Prix Négocié</th>
                                        <th className="text-right text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wider">RETURN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayData.map((c, idx) => (
                                        <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {c.inProgress && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                    <span className="text-white font-medium">{c.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(c.offerPriceSoum)}</td>
                                            <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(c.costPrice)}</td>
                                            <td className="px-4 py-3 text-gray-300 text-xs">{c.supplierSoum || '—'}</td>
                                            <td className="px-4 py-3 text-xs">
                                                {c.supplierExe ? (
                                                    <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${
                                                        c.supplierExe !== c.supplierSoum ? 'bg-amber-500/15 text-amber-300' : 'bg-white/5 text-gray-300'
                                                    }`}>{c.supplierExe}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">{fmt(c.negotiatedPrice)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-mono text-xs font-semibold ${
                                                    (c.returnAmount || 0) > 0 ? 'text-emerald-400' : (c.returnAmount || 0) < 0 ? 'text-red-400' : 'text-gray-500'
                                                }`}>{fmt(c.returnAmount)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {displayData.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                                            <td className="px-4 py-3 text-white font-bold">TOTAL</td>
                                            <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold">{fmt(totalBudget)}</td>
                                            <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold">{fmt(totalCost)}</td>
                                            <td colSpan={2} />
                                            <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold">{fmt(totalNegotiated)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-mono text-xs font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {fmt(totalReturn)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
