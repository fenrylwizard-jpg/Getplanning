"use client";

import { useState } from "react";
import { FileCheck, FileWarning, FileX, Files, FolderOpen, ClipboardCheck } from "lucide-react";
import T from "@/components/T";
import FileUploadZone from "@/components/hub/FileUploadZone";

interface DossierTechniqueTabProps {
    project: { id: string };
}

// Demo data for technical documents
const DEMO_LOTS = [
    {
        name: "Lot 01 — Gros Œuvre",
        docs: [
            { type: "Fiche Technique", ref: "FT-GO-001", title: "Béton C30/37 — Holcim", status: "approved" },
            { type: "Fiche Technique", ref: "FT-GO-002", title: "Acier B500 — ArcelorMittal", status: "approved" },
            { type: "Plan", ref: "PL-GO-001", title: "Plan Coffrage Niveau 0", status: "approved_with_remarks" },
            { type: "Plan", ref: "PL-GO-002", title: "Plan Coffrage Niveau 1", status: "submitted" },
            { type: "Calcul", ref: "CC-GO-001", title: "Note de Calcul Fondations", status: "approved" },
            { type: "Calcul", ref: "CC-GO-002", title: "Note de Calcul Dalles", status: "refused" },
        ],
    },
    {
        name: "Lot 02 — Menuiseries Ext.",
        docs: [
            { type: "Fiche Technique", ref: "FT-ME-001", title: "Profilé Schüco AWS 75", status: "approved" },
            { type: "Plan", ref: "PL-ME-001", title: "Plan Menuiseries Façade Nord", status: "approved_with_remarks" },
            { type: "Plan", ref: "PL-ME-002", title: "Plan Menuiseries Façade Sud", status: "submitted" },
            { type: "Diagramme", ref: "DG-ME-001", title: "Détail Seuil & Appui", status: "approved" },
        ],
    },
    {
        name: "Lot 03 — Électricité",
        docs: [
            { type: "Fiche Technique", ref: "FT-EL-001", title: "Câbles NYM Legrand", status: "submitted" },
            { type: "Fiche Technique", ref: "FT-EL-002", title: "Tableau TGBT", status: "not_submitted" },
            { type: "Plan", ref: "PL-EL-001", title: "Plan Électrique RDC", status: "not_submitted" },
            { type: "Calcul", ref: "CC-EL-001", title: "Bilan de Puissance", status: "submitted" },
        ],
    },
    {
        name: "Lot 04 — Plomberie",
        docs: [
            { type: "Fiche Technique", ref: "FT-PL-001", title: "Tubes PER Geberit", status: "approved" },
            { type: "Plan", ref: "PL-PL-001", title: "Réseaux EU/EV RDC", status: "approved_with_remarks" },
            { type: "Diagramme", ref: "DG-PL-001", title: "Schéma Isométrique", status: "submitted" },
        ],
    },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof FileCheck }> = {
    approved: { label: "Approuvé", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: FileCheck },
    approved_with_remarks: { label: "Approuvé s/r", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: FileWarning },
    submitted: { label: "Soumis", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Files },
    refused: { label: "Refusé", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: FileX },
    not_submitted: { label: "Non Soumis", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: Files },
};

export default function DossierTechniqueTab({ project }: DossierTechniqueTabProps) {
    const [expandedLot, setExpandedLot] = useState<string | null>(DEMO_LOTS[0].name);
    const [showDemo] = useState(true);

    const allDocs = DEMO_LOTS.flatMap(l => l.docs);
    const total = allDocs.length;
    const statusCounts = {
        approved: allDocs.filter(d => d.status === "approved").length,
        approved_with_remarks: allDocs.filter(d => d.status === "approved_with_remarks").length,
        submitted: allDocs.filter(d => d.status === "submitted").length,
        refused: allDocs.filter(d => d.status === "refused").length,
        not_submitted: allDocs.filter(d => d.status === "not_submitted").length,
    };

    // By type
    const docTypes = ["Fiche Technique", "Plan", "Calcul", "Diagramme"];

    return (
        <div className="flex flex-col gap-8">
            {/* Upload Zone */}
            <FileUploadZone
                projectId={project.id}
                module="technique"
                acceptTypes=".xlsx,.xls"
                title="Importer le Dossier Technique"
                subtitle="Glissez un fichier Excel contenant le suivi des documents techniques"
                accentColor="cyan"
                icon={<ClipboardCheck size={36} className="text-cyan-400" />}
            />

            {showDemo && (
                <>
                    {/* Overall KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {Object.entries(statusCounts).map(([key, count]) => {
                            const config = statusConfig[key];
                            const StatusIcon = config.icon;
                            return (
                                <div key={key} className={`${config.bg} border ${config.border} rounded-2xl p-5`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusIcon size={14} className={config.color} />
                                        <span className={`text-[9px] uppercase tracking-widest font-black ${config.color}`}>{config.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-2xl font-black ${config.color}`}>{count}</span>
                                        <span className="text-xs text-gray-500">/ {total}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div className={`h-full rounded-full ${config.bg.replace("/10", "/50")}`} style={{ width: `${(count / total) * 100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Status Distribution Bar */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                            <T k="hub_overall_status" />
                        </h3>
                        <div className="flex h-8 rounded-full overflow-hidden bg-white/5">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${(statusCounts.approved / total) * 100}%` }} />
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-400" style={{ width: `${(statusCounts.approved_with_remarks / total) * 100}%` }} />
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${(statusCounts.submitted / total) * 100}%` }} />
                            <div className="bg-gradient-to-r from-red-500 to-rose-400" style={{ width: `${(statusCounts.refused / total) * 100}%` }} />
                            <div className="bg-gray-600/50" style={{ width: `${(statusCounts.not_submitted / total) * 100}%` }} />
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3">
                            {Object.entries(statusCounts).filter(([,c]) => c > 0).map(([key, count]) => {
                                const config = statusConfig[key];
                                return (
                                    <span key={key} className={`text-[10px] uppercase tracking-widest font-bold ${config.color}`}>
                                        ● {config.label} {((count / total) * 100).toFixed(0)}%
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* By Document Type */}
                    <div className="bg-[#080d1a]/80 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                            <T k="hub_by_doc_type" />
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {docTypes.map(type => {
                                const typeDocs = allDocs.filter(d => d.type === type);
                                const approvedPct = typeDocs.length > 0 ? (typeDocs.filter(d => d.status === "approved" || d.status === "approved_with_remarks").length / typeDocs.length) * 100 : 0;
                                return (
                                    <div key={type} className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xs font-bold text-gray-300 mb-2">{type}</div>
                                        <div className="relative w-20 h-20 mx-auto">
                                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                <circle
                                                    cx="18" cy="18" r="14" fill="none"
                                                    stroke={approvedPct >= 75 ? "#4ade80" : approvedPct >= 50 ? "#fbbf24" : "#f87171"}
                                                    strokeWidth="3" strokeDasharray={`${approvedPct * 0.88} 100`} strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-sm font-black text-white">{Math.round(approvedPct)}%</span>
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-gray-500 mt-2">{typeDocs.filter(d => d.status === "approved" || d.status === "approved_with_remarks").length} / {typeDocs.length}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Per-Lot Breakdown */}
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <FolderOpen size={16} className="text-cyan-400" />
                            <T k="hub_per_lot_breakdown" />
                        </h3>
                        <div className="flex flex-col gap-3">
                            {DEMO_LOTS.map(lot => {
                                const isExpanded = expandedLot === lot.name;
                                const lotApproved = lot.docs.filter(d => d.status === "approved" || d.status === "approved_with_remarks").length;
                                const lotTotal = lot.docs.length;
                                const pct = (lotApproved / lotTotal) * 100;
                                return (
                                    <div key={lot.name} className="bg-[#080d1a]/80 border border-white/5 rounded-2xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandedLot(isExpanded ? null : lot.name)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FolderOpen size={18} className={pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"} />
                                                <span className="text-sm font-bold text-white">{lot.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400">{lotApproved}/{lotTotal}</span>
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="border-t border-white/5 p-4">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-left">
                                                            <th className="text-[9px] uppercase tracking-widest text-gray-500 font-bold pb-2 px-2">Réf</th>
                                                            <th className="text-[9px] uppercase tracking-widest text-gray-500 font-bold pb-2 px-2">Type</th>
                                                            <th className="text-[9px] uppercase tracking-widest text-gray-500 font-bold pb-2 px-2">Titre</th>
                                                            <th className="text-[9px] uppercase tracking-widest text-gray-500 font-bold pb-2 px-2 text-right">Statut</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {lot.docs.map((doc, idx) => {
                                                            const config = statusConfig[doc.status];
                                                            return (
                                                                <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                                    <td className="py-2.5 px-2 text-xs font-mono text-gray-400">{doc.ref}</td>
                                                                    <td className="py-2.5 px-2 text-xs text-gray-300">{doc.type}</td>
                                                                    <td className="py-2.5 px-2 text-xs text-white font-medium">{doc.title}</td>
                                                                    <td className="py-2.5 px-2 text-right">
                                                                        <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${config.bg} ${config.border} border ${config.color}`}>
                                                                            {config.label}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Demo notice */}
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 text-center">
                        <p className="text-xs text-cyan-300">
                            <T k="hub_demo_data_notice" /> — <T k="hub_upload_to_replace" />
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
