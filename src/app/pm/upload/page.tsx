"use client";
import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, X, ArrowRight, Save, Edit3, Trash2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/LanguageContext";
import T from '@/components/T';

interface TaskPreview {
    taskCode: string;
    description: string;
    category: string;
    unit: string;
    quantity: number;
    minutesPerUnit: number;
    initialQty?: number;
    initialHours?: number;
    zones?: Record<string, number>;
}

interface UploadPreviewResponse {
    tasks: TaskPreview[];
    totalHours: number;
    zones?: string[];
    error?: string;
}

interface FinalizeProjectResponse {
    error?: string;
}

export default function UploadXLS() {
    const router = useRouter();
    const { t } = useTranslation();
    const [step, setStep] = useState(1); // 1: Form, 2: Preview
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [projectName, setProjectName] = useState('');
    const [siteManagerId, setSiteManagerId] = useState('');
    const [location, setLocation] = useState('');
    const [subLocations, setSubLocations] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [smList, setSmList] = useState<{id: string, name: string}[]>([]);
    const [tasks, setTasks] = useState<TaskPreview[]>([]);
    const [totalHours, setTotalHours] = useState(0);
    const [detectedZones, setDetectedZones] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/users/sm').then(res => res.json()).then((data: { users?: {id: string, name: string}[] }) => {
            if (data.users) setSmList(data.users);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (file && !projectName) {
            setProjectName(file.name.replace('.xlsm', '').replace('.xlsx', '').replace('.xls', ''));
        }
    }, [file, projectName]);

    const addSubLocation = () => setSubLocations([...subLocations, ""]);
    const removeSubLocation = (index: number) => {
        const newLocs = [...subLocations];
        newLocs.splice(index, 1);
        setSubLocations(newLocs);
    };

    const handleDownloadTemplate = () => {
        // Generate a template with the sub-locations as zone columns
        const zones = subLocations.filter(s => s.trim());
        if (zones.length === 0) {
            setErrorMsg(t("add_zones_first"));
            return;
        }
        // Build a client-side template download via a hidden form or direct API call
        const params = new URLSearchParams();
        zones.forEach(z => params.append('zones', z));
        window.open(`/api/template/generate?${params.toString()}`, '_blank');
    };

    const handleUploadPreview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !projectName) return;

        setLoading(true);
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append("file", file);

            const resPreview = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data: UploadPreviewResponse = await resPreview.json();
            if (!resPreview.ok) throw new Error(data.error || "Failed to parse XLS");

            setTasks(data.tasks.map((t: TaskPreview) => ({ ...t, initialQty: 0, initialHours: 0 })));
            setTotalHours(data.totalHours);
            if (data.zones) setDetectedZones(data.zones);
            setStep(2);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        setLoading(true);
        setErrorMsg('');

        try {
            const resFinal = await fetch('/api/project/create-with-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: projectName,
                    siteManagerId,
                    location,
                    subLocations,
                    startDate,
                    endDate,
                    tasks
                })
            });

            const data: FinalizeProjectResponse = await resFinal.json();
            if (!resFinal.ok) throw new Error(data.error || "Failed to finalize project");

            setSuccess(true);
            setTimeout(() => router.push('/pm/dashboard'), 2000);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const updateTaskProgress = (taskCode: string, field: 'initialQty' | 'initialHours', value: string) => {
        const numVal = parseFloat(value) || 0;
        setTasks(tasks.map(t => {
            if (t.taskCode !== taskCode) return t;
            const updatedTask = { ...t, [field]: numVal };
            if (field === 'initialQty') {
                updatedTask.initialHours = Number(((numVal * updatedTask.minutesPerUnit) / 60).toFixed(2));
            }
            return updatedTask;
        }));
    };

    const updateTaskField = (taskCode: string, field: keyof TaskPreview, value: string | number) => {
        setTasks(prev => prev.map(t => t.taskCode === taskCode ? { ...t, [field]: value } : t));
    };

    const removeTask = (taskCode: string) => {
        setTasks(prev => prev.filter(t => t.taskCode !== taskCode));
    };

    if (success) {
        return (
            <div className="aurora-page flex flex-col items-center">
                <div className="max-w-xl w-full mt-20 text-center glass-card p-12">
                    <CheckCircle2 color="var(--emerald-400)" size={64} className="mx-auto mb-6 opacity-80" />
                    <h2 className="text-3xl font-black mb-4"><T k="success_project_created" /></h2>
                    <p className="text-gray-400"><T k="parsing_redirect" /></p>
                </div>
            </div>
        );
    }

    return (
        <div className="aurora-page flex flex-col items-center">
            
            <main className="max-w-5xl w-full px-6 py-12">
                
                {errorMsg && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-4">
                        <X size={24} /> {errorMsg}
                    </div>
                )}

                {step === 1 ? (
                    <div className="glass-card p-10 bg-[#0a1020]/80 backdrop-blur-xl border border-white/5 rounded-[32px] shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <FileSpreadsheet size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white"><T k="upload_xls_title" /></h1>
                                <p className="text-gray-400 text-sm"><T k="upload_xls_desc" /></p>
                            </div>
                        </div>

                        <form onSubmit={handleUploadPreview} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 block"><T k="project_name_label" /></label>
                                    <input required className="form-input w-full bg-white/5 border-white/10 rounded-xl p-4 text-white focus:border-purple-500 transition-all" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={t("project_name_placeholder")} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 block"><T k="site_manager_label" /></label>
                                    <select title={t("site_manager_label")} required className="form-input w-full bg-white/5 border-white/10 rounded-xl p-4 text-white" value={siteManagerId} onChange={(e) => setSiteManagerId(e.target.value)}>
                                        <option value="">{t("site_manager_placeholder")}</option>
                                        {smList.map(sm => <option key={sm.id} value={sm.id}>{sm.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 block"><T k="start_date_label" /></label>
                                        <input title={t("start_date_label")} type="date" className="form-input w-full bg-white/5 border-white/10 rounded-xl p-4 text-white" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 block"><T k="end_date_label" /></label>
                                        <input title={t("end_date_label")} type="date" className="form-input w-full bg-white/5 border-white/10 rounded-xl p-4 text-white" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block"><T k="location" /></label>
                                    <input className="form-input w-full bg-white/5 border-white/10 rounded-xl p-4 text-white" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("primary_location_placeholder")} />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 block"><T k="sub_locations" /></label>
                                    <div className="space-y-2">
                                        {subLocations.map((loc, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input title={t("sub_location_label") + " " + (idx + 1)} className="form-input flex-1 bg-white/5 border-white/10 rounded-xl p-3 text-white" value={loc} onChange={(e) => {
                                                    const newLocs = [...subLocations];
                                                    newLocs[idx] = e.target.value;
                                                    setSubLocations(newLocs);
                                                }} placeholder={t("sub_location_placeholder")} />
                                                <button title={t("remove")} type="button" onClick={() => removeSubLocation(idx)} className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl"><X size={18} /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addSubLocation} className="text-xs text-blue-400 font-bold hover:underline">+ <T k="add_sub_location" /></button>
                                    </div>
                                </div>

                                {/* Download Template Button */}
                                {subLocations.filter(s => s.trim()).length > 0 && (
                                    <button
                                        type="button"
                                        title={t("download_template")}
                                        onClick={handleDownloadTemplate}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition-all"
                                    >
                                        <Download size={20} />
                                        <T k="download_template" />
                                    </button>
                                )}

                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-0 block"><T k="budget_file_label" /></label>
                                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center bg-white/5 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center gap-4" onClick={() => document.getElementById('file-upload')?.click()}>
                                    <FileSpreadsheet size={48} className={file ? "text-emerald-400" : "text-white/20"} />
                                    <h4 className="font-bold">{file ? file.name : t("click_to_select_xls")}</h4>
                                    <input title={t("budget_file_label")} id="file-upload" type="file" required accept=".xls,.xlsx,.xlsm" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" aria-label={t("budget_file_label")} />
                                </div>
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <button type="submit" className="w-full btn-primary bg-gradient-to-r from-purple-600 to-blue-500 p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50" disabled={!file || !projectName || loading}>
                                    {loading ? t("creating_parsing") : <><T k="continue" /> <ArrowRight /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 w-full">
                        <div className="glass-card p-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                                    <Edit3 size={24} className="text-purple-400" />
                                    <T k="initial_progress" />
                                </h1>
                                <p className="text-emerald-400 font-bold mt-1">{tasks.length} postes • {totalHours.toFixed(1)} <T k="labor_hours" /></p>
                                {detectedZones.length > 0 && (
                                    <p className="text-blue-400 text-xs mt-1 font-semibold">
                                        Zones: {detectedZones.join(' • ')}
                                    </p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">Modifiez les cellules avant de finaliser</p>
                            </div>
                            <div className="flex gap-4">
                                <button title={t("back")} onClick={() => setStep(1)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-gray-400 hover:text-white transition-all"><T k="back" /></button>
                                <button title={t("finalize_import")} onClick={handleFinalize} className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center gap-2 transition-all shadow-lg" disabled={loading || tasks.length === 0}>
                                    {loading ? t("creating_parsing") : <><Save size={20} /> <T k="finalize_import" /></>}
                                </button>
                            </div>
                        </div>

                        <div className="glass-card bg-[#0a1020]/90 border border-white/10 rounded-[32px] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-black">
                                            <th className="px-4 py-5 border-b border-white/5 w-8"></th>
                                            <th className="px-4 py-5 border-b border-white/5 bg-purple-500/5 text-purple-400"><T k="category" /></th>
                                            <th className="px-4 py-5 border-b border-white/5"><T k="description" /></th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center bg-blue-500/5 text-blue-400">Qty</th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center bg-blue-500/5 text-blue-400">Unit</th>
                                            <th className="px-4 py-5 border-b border-white/5 text-center bg-blue-500/5 text-blue-400">Min/U</th>
                                            <th className="px-4 py-5 border-b border-white/5 bg-emerald-500/10 text-emerald-400 text-center"><T k="already_done" /> (Qty)</th>
                                            <th className="px-4 py-5 border-b border-white/5 bg-emerald-500/10 text-emerald-400 text-center"><T k="already_done" /> (H)</th>
                                            <th className="px-4 py-5 border-b border-white/5 bg-orange-500/10 text-orange-400 text-center">Solde (Qty)</th>
                                            <th className="px-4 py-5 border-b border-white/5 bg-orange-500/10 text-orange-400 text-center">Solde (H)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {tasks.map((task) => (
                                            <tr key={task.taskCode} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-2 py-3 text-center">
                                                    <button title="Supprimer" onClick={() => removeTask(task.taskCode)} className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 bg-purple-500/[0.03]">
                                                    <input
                                                        type="text"
                                                        title="Catégorie"
                                                        className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-purple-400 rounded-lg px-2 py-1.5 text-xs text-purple-300 font-bold outline-none transition-all"
                                                        value={task.category}
                                                        onChange={(e) => updateTaskField(task.taskCode, 'category', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <input
                                                        type="text"
                                                        title="Description"
                                                        className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-cyan-400 rounded-lg px-2 py-1.5 text-sm text-white font-medium outline-none transition-all"
                                                        value={task.description}
                                                        onChange={(e) => updateTaskField(task.taskCode, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-center bg-blue-500/[0.03]">
                                                    <input
                                                        type="number"
                                                        title="Quantité"
                                                        className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-blue-300 font-bold focus:border-blue-500 outline-none text-sm"
                                                        value={task.quantity || ''}
                                                        onChange={(e) => updateTaskField(task.taskCode, 'quantity', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-center bg-blue-500/[0.03]">
                                                    <input
                                                        type="text"
                                                        title="Unité"
                                                        className="w-16 bg-transparent border border-transparent hover:border-white/10 focus:border-blue-400 rounded-lg px-2 py-1.5 text-center text-xs text-gray-400 outline-none transition-all"
                                                        value={task.unit}
                                                        onChange={(e) => updateTaskField(task.taskCode, 'unit', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-center bg-blue-500/[0.03]">
                                                    <input
                                                        type="number"
                                                        title="Minutes par unité"
                                                        className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-blue-300 font-bold focus:border-blue-500 outline-none text-sm"
                                                        value={task.minutesPerUnit || ''}
                                                        onChange={(e) => updateTaskField(task.taskCode, 'minutesPerUnit', parseFloat(e.target.value) || 0)}
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-center bg-emerald-500/5">
                                                    <input 
                                                        type="number" 
                                                        className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-emerald-400 font-bold focus:border-emerald-500 outline-none text-sm"
                                                        value={task.initialQty || ''}
                                                        onChange={(e) => updateTaskProgress(task.taskCode, 'initialQty', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-center bg-emerald-500/5">
                                                    <input 
                                                        type="number" 
                                                        className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-center text-emerald-400 font-bold focus:border-emerald-500 outline-none text-sm"
                                                        value={task.initialHours || ''}
                                                        onChange={(e) => updateTaskProgress(task.taskCode, 'initialHours', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-center bg-orange-500/5">
                                                    <div className="w-20 mx-auto text-orange-400 font-bold text-sm">
                                                        {(task.quantity - (task.initialQty || 0)).toFixed(2).replace(/\.00$/, '')}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center bg-orange-500/5">
                                                    <div className="w-20 mx-auto text-orange-400 font-bold text-sm">
                                                        {(((task.quantity * task.minutesPerUnit) / 60) - (task.initialHours || 0)).toFixed(2).replace(/\.00$/, '')}
                                                    </div>
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
