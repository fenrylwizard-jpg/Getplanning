"use client";

import { useState } from "react";
import { ShoppingCart, Truck, Package, DollarSign, Building2, TrendingUp } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface AchatsTabProps {
    project?: { id: string };
}

// Demo data to showcase the design
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

export default function AchatsTab({ project }: AchatsTabProps) {
    const [showDemo] = useState(true);

    const totalBudget = DEMO_PURCHASES.reduce((sum, p) => sum + p.amount, 0);
    const deliveredTotal = DEMO_PURCHASES.filter(p => p.status === "delivered").reduce((sum, p) => sum + p.amount, 0);
    const orderedTotal = DEMO_PURCHASES.filter(p => p.status === "ordered").reduce((sum, p) => sum + p.amount, 0);
    const pendingTotal = DEMO_PURCHASES.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

    const uniqueSuppliers = [...new Set(DEMO_PURCHASES.map(p => p.supplier))];

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
            />

            {showDemo && (
                <>
                    {/* KPI Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <DollarSign size={18} className="text-purple-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_total_budget" /></span>
                            </div>
                            <div className="text-2xl font-black text-white">{(totalBudget / 1000).toFixed(0)}k €</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <Package size={18} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_delivered" /></span>
                            </div>
                            <div className="text-2xl font-black text-emerald-400">{(deliveredTotal / 1000).toFixed(0)}k €</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                    <Truck size={18} className="text-blue-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_ordered" /></span>
                            </div>
                            <div className="text-2xl font-black text-blue-400">{(orderedTotal / 1000).toFixed(0)}k €</div>
                        </div>
                        <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-amber-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-black"><T k="hub_pending" /></span>
                            </div>
                            <div className="text-2xl font-black text-amber-400">{(pendingTotal / 1000).toFixed(0)}k €</div>
                        </div>
                    </div>

                    {/* Status Distribution Bar */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                            <T k="hub_status_distribution" />
                        </h3>
                        <div className="flex h-6 rounded-full overflow-hidden bg-white/5">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${(deliveredTotal / totalBudget) * 100}%` }} />
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${(orderedTotal / totalBudget) * 100}%` }} />
                            <div className="bg-gradient-to-r from-amber-500 to-orange-400 transition-all" style={{ width: `${(pendingTotal / totalBudget) * 100}%` }} />
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] uppercase tracking-widest font-bold">
                            <span className="text-emerald-400"><T k="hub_delivered" /> {((deliveredTotal / totalBudget) * 100).toFixed(0)}%</span>
                            <span className="text-blue-400"><T k="hub_ordered" /> {((orderedTotal / totalBudget) * 100).toFixed(0)}%</span>
                            <span className="text-amber-400"><T k="hub_pending" /> {((pendingTotal / totalBudget) * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    {/* Purchase Cards Grid */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <ShoppingCart size={16} className="text-amber-400" />
                            <T k="hub_major_purchases" /> ({DEMO_PURCHASES.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {DEMO_PURCHASES.map((purchase, idx) => {
                                const status = statusConfig[purchase.status] || statusConfig.pending;
                                return (
                                    <div key={idx} className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{purchase.category}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{purchase.description}</p>
                                            </div>
                                            <span className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full ${status.bg} ${status.border} border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={12} className="text-gray-500" />
                                                <span className="text-xs text-gray-300 font-medium">{purchase.supplier}</span>
                                            </div>
                                            <span className="text-lg font-black text-white">{purchase.amount.toLocaleString()} €</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Suppliers Summary */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Building2 size={16} className="text-cyan-400" />
                            <T k="hub_suppliers" /> ({uniqueSuppliers.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {uniqueSuppliers.map((supplier, idx) => {
                                const supplierPurchases = DEMO_PURCHASES.filter(p => p.supplier === supplier);
                                const supplierTotal = supplierPurchases.reduce((sum, p) => sum + p.amount, 0);
                                return (
                                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-center hover:border-white/10 transition-colors">
                                        <div className="text-xs font-bold text-gray-300 mb-1 truncate">{supplier}</div>
                                        <div className="text-base font-black text-white">{(supplierTotal / 1000).toFixed(0)}k €</div>
                                        <div className="text-[9px] text-gray-500 mt-0.5">{supplierPurchases.length} <T k="hub_purchase_count" /></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Demo notice */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-amber-300">
                            <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
