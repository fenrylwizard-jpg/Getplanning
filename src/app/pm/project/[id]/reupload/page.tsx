"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FileSpreadsheet, Download, Upload, ArrowLeft, CheckCircle2,
    Plus, Minus, Edit3, AlertTriangle, Save, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/LanguageContext';

interface DiffItem {
    type: 'modified' | 'added' | 'removed' | 'unchanged';
    taskCode: string;
    description: string;
    category: string;
    unit: string;
    oldQuantity?: number;
    newQuantity?: number;
    oldMinutesPerUnit?: number;
    newMinutesPerUnit?: number;
    completedQuantity?: number;
    quantity?: number;
    minutesPerUnit?: number;
}

interface ParsedTask {
    taskCode: string;
    description: string;
    category: string;
    unit: string;
    quantity: number;
    minutesPerUnit: number;
}

export default function ReuploadPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const projectId = params.id as string;

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [diff, setDiff] = useState<DiffItem[] | null>(null);
    const [summary, setSummary] = useState<{ added: number; modified: number; removed: number; unchanged: number } | null>(null);
    const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
    const [confirming, setConfirming] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleUploadPreview = async () => {
        if (!file) return;
        setLoading(true);
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/project/${projectId}/reupload`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse");

            setDiff(data.diff);
            setSummary(data.summary);
            setParsedTasks(data.parsedTasks);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!diff || !parsedTasks) return;
        setConfirming(true);
        setErrorMsg('');

        try {
            const removedDescriptions = diff
                .filter(d => d.type === 'removed')
                .map(d => d.description);

            const res = await fetch(`/api/project/${projectId}/reupload/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tasks: parsedTasks,
                    removedDescriptions,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de l'application");

            setSuccess(true);
            toast.success(`Mise à jour: ${data.updated} modifiés, ${data.added} ajoutés, ${data.removed} supprimés`);
            setTimeout(() => router.push(`/pm/project/${projectId}`), 2000);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : String(err));
        } finally {
            setConfirming(false);
        }
    };

    if (success) {
        return (
            <div className="aurora-page flex flex-col items-center">
                <div className="max-w-xl w-full mt-20 text-center glass-card p-12">
                    <CheckCircle2 className="mx-auto mb-6 text-emerald-400" size={64} />
                    <h2 className="text-3xl font-black mb-4">Projet mis à jour ✓</h2>
                    <p className="text-gray-400">Redirection en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="aurora-page flex flex-col items-center">
            <main className="max-w-6xl w-full px-6 py-12">

                {/* Back Link */}
                <Link href={`/pm/project/${projectId}`} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm font-bold">
                    <ArrowLeft size={16} /> Retour au projet
                </Link>

                {errorMsg && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 flex items-center gap-4">
                        <X size={24} /> {errorMsg}
                    </div>
                )}

                {!diff ? (
                    /* Step 1: Export & Upload */
                    <div className="glass-card p-10 bg-[#0a1020]/80 backdrop-blur-xl border border-white/5 rounded-md shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <FileSpreadsheet size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white">{t('update_project') || 'Mettre à jour le projet'}</h1>
                                <p className="text-gray-400 text-sm">Exportez, modifiez, puis ré-uploadez le fichier Excel</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Step 1: Export */}
                            <div className="bg-[#060b18]/50 border border-white/5 rounded-md p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black">1</span>
                                    <h3 className="text-lg font-bold text-white">Exporter l&apos;état actuel</h3>
                                </div>
                                <p className="text-gray-400 text-sm mb-6">
                                    Téléchargez le fichier Excel avec toutes les tâches et quantités réalisées.
                                </p>
                                <a
                                    href={`/api/project/${projectId}/export`}
                                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition-all w-full"
                                >
                                    <Download size={20} /> Télécharger le fichier Excel
                                </a>
                            </div>

                            {/* Step 2: Upload modified file */}
                            <div className="bg-[#060b18]/50 border border-white/5 rounded-md p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-black">2</span>
                                    <h3 className="text-lg font-bold text-white">Ré-uploader le fichier modifié</h3>
                                </div>
                                <p className="text-gray-400 text-sm mb-6">
                                    Modifiez les quantités, ajoutez ou retirez des postes, puis uploadez ici.
                                </p>
                                <div
                                    className="border-2 border-dashed border-white/10 rounded-md p-6 text-center bg-white/5 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center gap-3 mb-4"
                                    onClick={() => document.getElementById('reupload-input')?.click()}
                                >
                                    <Upload size={32} className={file ? "text-blue-400" : "text-white/20"} />
                                    <span className="font-bold text-sm">{file ? file.name : "Cliquer pour sélectionner"}</span>
                                    <input id="reupload-input" type="file" accept=".xls,.xlsx,.xlsm" title="Sélectionner un fichier Excel" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                                </div>
                                <button
                                    onClick={handleUploadPreview}
                                    disabled={!file || loading}
                                    className="w-full px-6 py-4 rounded-md bg-gradient-to-r from-purple-600 to-blue-500 font-black text-white flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Analyse en cours...' : <><FileSpreadsheet size={20} /> Analyser les changements</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Step 2: Diff Preview */
                    <div className="flex flex-col gap-8">
                        {/* Summary Header */}
                        <div className="glass-card p-8 bg-[#0a1020]/80 border border-white/10 rounded-md flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                    <Edit3 size={24} className="text-blue-400" />
                                    Aperçu des changements
                                </h1>
                                {summary && (
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        {summary.modified > 0 && (
                                            <span className="px-3 py-1 rounded-sm bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                                                <Edit3 size={12} /> {summary.modified} modifié(s)
                                            </span>
                                        )}
                                        {summary.added > 0 && (
                                            <span className="px-3 py-1 rounded-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                <Plus size={12} /> {summary.added} ajouté(s)
                                            </span>
                                        )}
                                        {summary.removed > 0 && (
                                            <span className="px-3 py-1 rounded-sm bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1">
                                                <Minus size={12} /> {summary.removed} supprimé(s)
                                            </span>
                                        )}
                                        <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10 text-gray-400 text-xs font-bold">
                                            {summary.unchanged} inchangé(s)
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => { setDiff(null); setFile(null); }} className="px-6 py-3 rounded-md bg-white/5 border border-white/10 font-bold text-gray-400 hover:text-white transition-all">
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={confirming}
                                    className="px-8 py-3 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {confirming ? 'Application en cours...' : <><Save size={20} /> Confirmer & Appliquer</>}
                                </button>
                            </div>
                        </div>

                        {/* Warning about completed quantities */}
                        {summary && summary.removed > 0 && (
                            <div className="flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/30 rounded-md">
                                <AlertTriangle size={20} className="text-red-400 mt-0.5 shrink-0" />
                                <div className="text-sm text-red-300">
                                    <strong>Attention:</strong> {summary.removed} tâche(s) seront supprimées avec leur historique de progression.
                                </div>
                            </div>
                        )}

                        {/* Diff Table */}
                        <div className="glass-card bg-[#0a1020]/90 border border-white/10 rounded-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-black">
                                            <th className="px-4 py-5 border-b border-white/5 w-12">Type</th>
                                            <th className="px-4 py-5 border-b border-white/5">Catégorie</th>
                                            <th className="px-4 py-5 border-b border-white/5">Description</th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center">Ancienne Qty</th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center">Nouvelle Qty</th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center">Réalisé</th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center">Min/U</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {diff.filter(d => d.type !== 'unchanged').map((item, i) => (
                                            <tr key={i} className={`transition-colors ${
                                                item.type === 'added' ? 'bg-emerald-500/5' :
                                                item.type === 'removed' ? 'bg-red-500/5' :
                                                item.type === 'modified' ? 'bg-amber-500/5' : ''
                                            }`}>
                                                <td className="px-4 py-3">
                                                    {item.type === 'added' && <Plus size={16} className="text-emerald-400" />}
                                                    {item.type === 'removed' && <Minus size={16} className="text-red-400" />}
                                                    {item.type === 'modified' && <Edit3 size={16} className="text-amber-400" />}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-purple-300 font-bold">{item.category}</td>
                                                <td className="px-4 py-3 text-sm text-white font-medium">{item.description}</td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    {item.type === 'removed' && <span className="text-red-400 line-through">{item.oldQuantity}</span>}
                                                    {item.type === 'modified' && <span className="text-gray-400 line-through">{item.oldQuantity}</span>}
                                                    {item.type === 'added' && <span className="text-gray-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm font-bold">
                                                    {item.type === 'added' && <span className="text-emerald-400">{item.quantity}</span>}
                                                    {item.type === 'modified' && <span className="text-amber-400">{item.newQuantity}</span>}
                                                    {item.type === 'removed' && <span className="text-gray-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    <span className="text-cyan-400 font-bold">{item.completedQuantity ?? '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-xs text-gray-400">
                                                    {item.type === 'modified' && item.oldMinutesPerUnit !== item.newMinutesPerUnit ? (
                                                        <span><span className="line-through text-gray-600">{item.oldMinutesPerUnit}</span> → <span className="text-amber-400">{item.newMinutesPerUnit}</span></span>
                                                    ) : (
                                                        item.oldMinutesPerUnit || item.minutesPerUnit || '—'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
