"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    UserIcon, Folder, Activity, Target, ArrowLeft, Award,
    TrendingUp, MapPin
} from 'lucide-react';
import AvatarDisplay from '@/components/AvatarDisplay';
import T from '@/components/T';
import { useTranslation } from '@/lib/LanguageContext';

interface ProjectStats {
    id: string;
    name: string;
    location: string | null;
    pm?: string | null;
    sm?: string | null;
    taskCount: number;
    budgetHours: number;
    earnedHours: number;
    pct: number;
    closedPlans: number;
    hitPlans: number;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    xp: number;
    level: number;
    characterId: number;
    createdAt: string;
    badges: { name: string; icon: string; description: string; earnedAt: string }[];
}

export default function UserProfilePage() {
    const params = useParams();
    const { t } = useTranslation();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [pmProjects, setPmProjects] = useState<ProjectStats[]>([]);
    const [smProjects, setSmProjects] = useState<ProjectStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!params.id) return;
        fetch(`/api/user/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setUser(data.user);
                setPmProjects(data.pmProjects || []);
                setSmProjects(data.smProjects || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#060b18] text-white">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-gray-400"><T k="admin_loading" /></span>
            </div>
        </div>
    );

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-[#060b18] text-white">
            <div className="text-center">
                <UserIcon size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Utilisateur non trouvé</p>
            </div>
        </div>
    );

    const totalProjects = pmProjects.length + smProjects.length;
    const allProjects = [...pmProjects, ...smProjects];
    const totalEarnedHours = allProjects.reduce((s, p) => s + p.earnedHours, 0);
    const totalClosedPlans = allProjects.reduce((s, p) => s + p.closedPlans, 0);
    const totalHitPlans = allProjects.reduce((s, p) => s + p.hitPlans, 0);
    const hitRate = totalClosedPlans > 0 ? Math.round((totalHitPlans / totalClosedPlans) * 100) : 0;

    const roleLabel = user.role === 'ADMIN' ? 'Administrateur' : user.role === 'PM' ? t('project_manager') : t('site_manager');
    const roleColor = user.role === 'ADMIN' ? 'text-purple-400' : user.role === 'PM' ? 'text-amber-400' : 'text-cyan-400';

    const getProgressWidth = (xp: number) => {
        const pct = Math.floor(((xp % 1000) / 10) / 5) * 5;
        const widths: Record<number, string> = {
            0: "w-0", 5: "w-[5%]", 10: "w-[10%]", 15: "w-[15%]", 20: "w-[20%]", 25: "w-[25%]",
            30: "w-[30%]", 35: "w-[35%]", 40: "w-[40%]", 45: "w-[45%]", 50: "w-[50%]",
            55: "w-[55%]", 60: "w-[60%]", 65: "w-[65%]", 70: "w-[70%]", 75: "w-[75%]",
            80: "w-[80%]", 85: "w-[85%]", 90: "w-[90%]", 95: "w-[95%]", 100: "w-full"
        };
        return widths[pct] || "w-0";
    };

    return (
        <div className="aurora-page flex flex-col items-center w-full">
            <main className="min-h-screen bg-[#060b18]/80 backdrop-blur-sm text-white px-6 py-10 w-full max-w-6xl flex flex-col">

                {/* Back Button */}
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm font-bold">
                    <ArrowLeft size={16} /> Retour
                </Link>

                {/* User Hero */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    <div className="glass-card p-8 bg-[#080d1a]/80 backdrop-blur-md rounded-md border border-white/5 shadow-xl flex items-center gap-6">
                        <AvatarDisplay characterId={user.characterId} level={user.level} size={120} />
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-white">{user.name}</span>
                            <span className={`text-xs uppercase tracking-widest font-bold ${roleColor}`}>LVL {user.level} {roleLabel}</span>
                            <span className="text-xs text-gray-500 mt-1">{user.email}</span>
                            <div className="mt-3 w-48 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className={`bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-1000 ${getProgressWidth(user.xp)}`} />
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1 uppercase font-black">{user.xp} XP</span>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        {[
                            { icon: Folder, label: t('projects'), value: totalProjects, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                            { icon: Activity, label: t('labor_hours'), value: `${totalEarnedHours}h`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { icon: Target, label: t('target_rate'), value: `${hitRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { icon: TrendingUp, label: t('closed_plans'), value: totalClosedPlans, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        ].map(({ icon: Icon, label, value, color, bg }) => (
                            <div key={label} className={`${bg} border border-white/10 rounded-md p-4 flex flex-col items-center gap-2`}>
                                <Icon size={22} className={color} />
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center">{label}</div>
                                <div className={`text-2xl font-black ${color}`}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Badges */}
                {user.badges.length > 0 && (
                    <div className="bg-[#080d1a] border border-white/5 rounded-md p-6 mb-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Award size={16} className="text-amber-400" /> Badges ({user.badges.length})
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {user.badges.map((badge, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                    <span className="text-lg">{badge.icon}</span>
                                    <div>
                                        <div className="text-xs font-bold text-amber-300">{badge.name}</div>
                                        <div className="text-[10px] text-gray-500">{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PM Projects */}
                {pmProjects.length > 0 && (
                    <div className="bg-[#080d1a] border border-white/5 rounded-md p-6 mb-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Folder size={16} className="text-amber-400" /> Projets en tant que PM ({pmProjects.length})
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="pb-3 pr-4">{t('project_field')}</th>
                                        <th className="pb-3 pr-4">{t('site_manager')}</th>
                                        <th className="pb-3 pr-4">{t('location')}</th>
                                        <th className="pb-3 pr-4">{t('progress')}</th>
                                        <th className="pb-3">{t('targets')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pmProjects.map(p => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 pr-4">
                                                <Link href={`/pm/project/${p.id}`} className="font-bold text-white hover:text-purple-400 transition-colors">
                                                    {p.name}
                                                </Link>
                                            </td>
                                            <td className="py-3 pr-4 text-cyan-400 text-xs font-bold">{p.sm || '—'}</td>
                                            <td className="py-3 pr-4 text-gray-400 text-xs">
                                                {p.location && <span className="flex items-center gap-1"><MapPin size={10} />{p.location}</span>}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <style>{`.up-${p.id.replace(/[^a-z0-9]/gi,'')}{width:${p.pct}%}`}</style>
                                                        <div className={`up-${p.id.replace(/[^a-z0-9]/gi,'')} h-full rounded-full ${p.pct >= 80 ? 'bg-emerald-400' : p.pct >= 40 ? 'bg-blue-400' : 'bg-amber-400'}`} />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{p.pct}%</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1">{p.earnedHours}h / {p.budgetHours}h</div>
                                            </td>
                                            <td className="py-3 text-gray-400 text-xs">{p.hitPlans}/{p.closedPlans} sem.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SM Projects */}
                {smProjects.length > 0 && (
                    <div className="bg-[#080d1a] border border-white/5 rounded-md p-6 mb-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Folder size={16} className="text-cyan-400" /> Projets en tant que SM ({smProjects.length})
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="pb-3 pr-4">{t('project_field')}</th>
                                        <th className="pb-3 pr-4">{t('project_manager')}</th>
                                        <th className="pb-3 pr-4">{t('location')}</th>
                                        <th className="pb-3 pr-4">{t('progress')}</th>
                                        <th className="pb-3">{t('targets')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {smProjects.map(p => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 pr-4">
                                                <Link href={`/pm/project/${p.id}`} className="font-bold text-white hover:text-cyan-400 transition-colors">
                                                    {p.name}
                                                </Link>
                                            </td>
                                            <td className="py-3 pr-4 text-amber-400 text-xs font-bold">{p.pm || '—'}</td>
                                            <td className="py-3 pr-4 text-gray-400 text-xs">
                                                {p.location && <span className="flex items-center gap-1"><MapPin size={10} />{p.location}</span>}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <style>{`.up-${p.id.replace(/[^a-z0-9]/gi,'')}{width:${p.pct}%}`}</style>
                                                        <div className={`up-${p.id.replace(/[^a-z0-9]/gi,'')} h-full rounded-full ${p.pct >= 80 ? 'bg-emerald-400' : p.pct >= 40 ? 'bg-blue-400' : 'bg-amber-400'}`} />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{p.pct}%</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1">{p.earnedHours}h / {p.budgetHours}h</div>
                                            </td>
                                            <td className="py-3 text-gray-400 text-xs">{p.hitPlans}/{p.closedPlans} sem.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {totalProjects === 0 && (
                    <div className="bg-[#080d1a] border border-white/5 rounded-md p-12 text-center text-gray-500">
                        Aucun projet assigné
                    </div>
                )}
            </main>
        </div>
    );
}
