"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, X, MapPin, Calendar, UserIcon, Folder } from "lucide-react";
import { toast } from "sonner";

interface UserOption { id: string; name: string; email: string; }
interface SubLoc { id: string; name: string; }

export default function AdminProjectEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [pmId, setPmId] = useState("");
    const [smId, setSmId] = useState("");
    const [subLocations, setSubLocations] = useState<string[]>([]);
    const [newSubLoc, setNewSubLoc] = useState("");

    const [pms, setPms] = useState<UserOption[]>([]);
    const [sms, setSms] = useState<UserOption[]>([]);

    useEffect(() => {
        fetch(`/api/project/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.project) {
                    const p = data.project;
                    setName(p.name || "");
                    setLocation(p.location || "");
                    setStartDate(p.startDate ? p.startDate.slice(0, 10) : "");
                    setEndDate(p.endDate ? p.endDate.slice(0, 10) : "");
                    setPmId(p.projectManagerId || "");
                    setSmId(p.siteManagerId || "");
                    setSubLocations(p.subLocations?.map((s: SubLoc) => s.name) || []);
                }
                setPms(data.pms || []);
                setSms(data.sms || []);
                setLoading(false);
            })
            .catch(() => {
                toast.error("Erreur de chargement");
                setLoading(false);
            });
    }, [id]);

    const handleSave = async () => {
        if (!name.trim()) { toast.error("Le nom est requis"); return; }
        if (!pmId) { toast.error("Un chef de projet est requis"); return; }
        setSaving(true);
        try {
            const res = await fetch(`/api/project/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    location: location.trim(),
                    startDate: startDate || null,
                    endDate: endDate || null,
                    projectManagerId: pmId,
                    siteManagerId: smId || null,
                    subLocations: subLocations.filter(s => s.trim())
                })
            });
            if (res.ok) {
                toast.success("Projet mis à jour ✓");
                router.push("/admin/dashboard");
            } else {
                const err = await res.json();
                toast.error(err.error || "Erreur");
            }
        } catch {
            toast.error("Erreur serveur");
        } finally {
            setSaving(false);
        }
    };

    const addSubLoc = () => {
        if (newSubLoc.trim() && !subLocations.includes(newSubLoc.trim())) {
            setSubLocations(prev => [...prev, newSubLoc.trim()]);
            setNewSubLoc("");
        }
    };

    if (loading) return (
        <div className="aurora-page min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="aurora-page min-h-screen text-white">
            <main className="max-w-3xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button title="Retour" onClick={() => router.push("/admin/dashboard")} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black">Configuration du projet</h1>
                        <p className="text-sm text-gray-500">Modifier les paramètres du projet</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Project Name */}
                    <div className="glass-card p-6 rounded-xl">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Folder size={14} /> Nom du projet
                        </label>
                        <input
                            type="text"
                            title="Nom du projet"
                            placeholder="Ex: Projet ABC"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-bold focus:border-purple-500/50 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Location */}
                    <div className="glass-card p-6 rounded-xl">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <MapPin size={14} /> Localisation
                        </label>
                        <input
                            type="text"
                            title="Localisation"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Ex: Bruxelles, Etage 3..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Dates */}
                    <div className="glass-card p-6 rounded-xl">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Calendar size={14} /> Dates
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Début</span>
                                <input type="date" title="Date de début" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors mt-1" />
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Fin</span>
                                <input type="date" title="Date de fin" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* PM / SM */}
                    <div className="glass-card p-6 rounded-xl">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <UserIcon size={14} /> Équipe
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Chef de Projet (PM)</span>
                                <select title="Chef de Projet" value={pmId} onChange={e => setPmId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors mt-1 appearance-none">
                                    <option value="" className="bg-gray-900">-- Sélectionner --</option>
                                    {pms.map(u => <option key={u.id} value={u.id} className="bg-gray-900">{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Chef d&apos;Équipe (SM)</span>
                                <select title="Chef d'Équipe" value={smId} onChange={e => setSmId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors mt-1 appearance-none">
                                    <option value="" className="bg-gray-900">-- Aucun --</option>
                                    {sms.map(u => <option key={u.id} value={u.id} className="bg-gray-900">{u.name} ({u.email})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sub-locations */}
                    <div className="glass-card p-6 rounded-xl">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <MapPin size={14} /> Sous-localisations
                        </label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {subLocations.map((loc, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-bold flex items-center gap-2">
                                    {loc}
                                    <button title="Supprimer" onClick={() => setSubLocations(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {subLocations.length === 0 && <span className="text-gray-600 text-sm">Aucune sous-localisation</span>}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSubLoc}
                                onChange={e => setNewSubLoc(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubLoc())}
                                placeholder="Ajouter une localisation..."
                                title="Nouvelle sous-localisation"
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-purple-500/50 focus:outline-none transition-colors"
                            />
                            <button title="Ajouter localisation" onClick={addSubLoc} className="px-4 py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Sauvegarder</>}
                    </button>
                </div>
            </main>
        </div>
    );
}
