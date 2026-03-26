"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ShieldCheck, CheckCircle, XCircle, Clock, UserIcon, LogOut,
    TrendingUp, Euro, Activity, Folder, Target, RefreshCw, Globe, ListOrdered, ArrowRight, Trash2,
    X, Sparkles, History, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import AvatarDisplay from '@/components/AvatarDisplay';
import T from '@/components/T';
import { useTranslation } from '@/lib/LanguageContext';
import AdminWeeklyGraph from '@/components/AdminWeeklyGraph';

interface AdminStats {
    totalProjects: number;
    totalPMs: number;
    totalSMs: number;
    totalBudgetHours: number;
    totalEarnedHours: number;
    totalBudgetEur: number;
    totalEarnedEur: number;
    globalPct: number;
    totalWeeklyPlans: number;
    closedPlans: number;
    hitPlans: number;
    hitRate: number;
    totalTasks: number;
    projects: {
        id: string;
        name: string;
        pm: string;
        budgetHours: number;
        earnedHours: number;
        pct: number;
        weeksClosed: number;
        weeksHit: number;
    }[];
}

interface XpLogEntry {
    id: string;
    amount: number;
    source: string;
    breakdown: string | null;
    projectId: string | null;
    projectName: string | null;
    createdAt: string;
}

interface XpModalUser {
    id: string;
    name: string;
    xp: number;
    level: number;
    characterId: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { t } = useTranslation();
    const [users, setUsers] = useState<{ id: string, name: string, email: string, role: string, status: string, level?: number, characterId?: number }[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [cronRunning, setCronRunning] = useState(false);
    const [cronResult, setCronResult] = useState<string | null>(null);

    // XP Log Modal state
    const [xpModalOpen, setXpModalOpen] = useState(false);
    const [xpModalUser, setXpModalUser] = useState<XpModalUser | null>(null);
    const [xpLogs, setXpLogs] = useState<XpLogEntry[]>([]);
    const [xpLogsLoading, setXpLogsLoading] = useState(false);

    const openXpModal = async (userId: string) => {
        setXpModalOpen(true);
        setXpLogsLoading(true);
        setXpLogs([]);
        setXpModalUser(null);
        try {
            const res = await fetch(`/api/admin/users/${userId}/xp-logs`);
            if (res.ok) {
                const data = await res.json();
                setXpModalUser(data.user);
                setXpLogs(data.logs || []);
            } else {
                toast.error('Failed to load XP logs');
            }
        } catch {
            toast.error('Failed to load XP logs');
        } finally {
            setXpLogsLoading(false);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/stats'),
            ]);
            if (usersRes.status === 401 || usersRes.status === 403) {
                router.push('/login');
                return;
            }
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
            }
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
        const res = await fetch(`/api/admin/users/${userId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        if (res.ok) {
            toast.success(action === 'APPROVE' ? 'Utilisateur approuvé ✓' : 'Utilisateur rejeté');
            fetchData();
        }
        else toast.error(t('action_error'));
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const handleCron = async () => {
        setCronRunning(true);
        setCronResult(null);
        try {
            const res = await fetch('/api/cron/weekly-close?secret=gp-internal');
            const data = await res.json();
            setCronResult(data.message || t('week_closed'));
            fetchData();
        } catch {
            setCronResult(t('auto_close_error'));
        } finally {
            setCronRunning(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#060b18] text-white">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-gray-400"><T k="admin_loading" /></span>
            </div>
        </div>
    );

    const pendingUsers = users.filter(u => u.status === 'PENDING').sort((a, b) => (b.level || 0) - (a.level || 0));
    const processedUsers = users.filter(u => u.status !== 'PENDING').sort((a, b) => (b.level || 0) - (a.level || 0));

    return (
        <div className="aurora-page flex flex-col items-center w-full">
            <main className="min-h-screen bg-[#060b18]/80 backdrop-blur-sm text-white px-6 py-10 w-full max-w-7xl flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center">
                        <ShieldCheck size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white m-0"><T k="admin_dashboard" /></h1>
                        <p className="text-gray-500 text-sm m-0"><T k="admin_dashboard_desc" /></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCron}
                        disabled={cronRunning}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-bold disabled:opacity-50"
                        title={t('close_week')}
                    >
                        <RefreshCw size={16} className={cronRunning ? 'animate-spin' : ''} />
                        <T k="close_week" />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all text-sm font-bold"
                        onClick={handleLogout}
                        title={t('logout')}
                    >
                        <LogOut size={16} /> <T k="logout" />
                    </button>
                </div>
            </div>

            {cronResult && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
                    ✓ {cronResult}
                </div>
            )}

            {/* Weekly Performance Graph */}
            <AdminWeeklyGraph />

            {/* Global KPI Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: Folder, label: t('projects'), value: stats.totalProjects, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { icon: Activity, label: t('closed_plans'), value: stats.closedPlans, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { icon: Target, label: t('target_rate'), value: `${stats.hitRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { icon: Globe, label: t('total_tasks'), value: stats.totalTasks.toLocaleString(), color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className={`${bg} border border-white/10 rounded-2xl p-5 flex items-center gap-4`}>
                            <Icon size={28} className={color} />
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</div>
                                <div className={`text-2xl font-black ${color}`}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Budget + Profitability */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Activity size={16} /> <T k="global_labor_hours" />
                        </h3>
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>{t('achieved_value')}: <strong className="text-white">{stats.totalEarnedHours.toLocaleString()}h</strong></span>
                            <span>{t('budget')}: <strong className="text-white">{stats.totalBudgetHours.toLocaleString()}h</strong></span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <style>{`.admin-bar-mo{width:${Math.min(100, stats.globalPct)}%}`}</style>
                            <div className="admin-bar-mo h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700" />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{stats.globalPct}{t('pct_achieved')}</div>
                    </div>

                    <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Euro size={16} /> <T k="profitability" /> (€43.35/h)
                        </h3>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">{t('achieved_value')}: <strong className="text-emerald-400">{stats.totalEarnedEur.toLocaleString()} €</strong></span>
                            <span className="text-gray-400">{t('budget')}: <strong className="text-white">{stats.totalBudgetEur.toLocaleString()} €</strong></span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <style>{`.admin-bar-eur{width:${Math.min(100, stats.globalPct)}%}`}</style>
                            <div className="admin-bar-eur h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700" />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <TrendingUp size={10} /> {stats.hitRate}{t('target_hit_rate')}
                        </div>
                    </div>
                </div>
            )}

            {/* Projects Table */}
            {stats && stats.projects.length > 0 && (
                <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-6 mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Folder size={16} /> <T k="projects" /> ({stats.projects.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase border-b border-white/5">
                                <tr>
                                    <th className="pb-3 pr-4"><T k="project_field" /></th>
                                    <th className="pb-3 pr-4"><T k="project_manager" /></th>
                                    <th className="pb-3 pr-4"><T k="labor_budget" /></th>
                                    <th className="pb-3 pr-4"><T k="achieved_value" /></th>
                                    <th className="pb-3 pr-4"><T k="progress" /></th>
                                    <th className="pb-3 pr-4"><T k="targets" /></th>
                                    <th className="pb-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.projects.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                                        <td className="py-3 pr-4">
                                            <Link href={`/pm/project/${p.id}`} className="font-bold text-white hover:text-purple-300 transition-colors">
                                                {p.name}
                                            </Link>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-400">{p.pm}</td>
                                        <td className="py-3 pr-4 text-gray-300">{p.budgetHours.toLocaleString()}h</td>
                                        <td className="py-3 pr-4 text-gray-300">{p.earnedHours.toLocaleString()}h</td>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <style>{`.proj-bar-${p.id.replace(/[^a-z0-9]/gi,'')}{width:${p.pct}%}`}</style>
                                                    <div
                                                        className={`proj-bar-${p.id.replace(/[^a-z0-9]/gi,'')} h-full rounded-full ${p.pct >= 80 ? 'bg-emerald-400' : p.pct >= 40 ? 'bg-blue-400' : 'bg-amber-400'}`}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400">{p.pct}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-400 text-xs">
                                            {p.weeksHit}/{p.weeksClosed} sem.
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/pm/project/${p.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-all">
                                                    <ArrowRight size={12} /> Hub
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        const pin = prompt(`Pour supprimer "${p.name}", entrez le code PIN :`);
                                                        if (pin !== '645428') { if (pin !== null) toast.error('Code PIN incorrect.'); return; }
                                                        if (!confirm(`Confirmez la suppression DÉFINITIVE de "${p.name}" ?`)) return;
                                                        fetch(`/api/project/${p.id}`, { method: 'DELETE' }).then(r => {
                                                            if (r.ok) { toast.success(`Projet "${p.name}" supprimé.`); fetchData(); }
                                                            else toast.error('Erreur lors de la suppression.');
                                                        });
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
                                                >
                                                    <Trash2 size={12} /> Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {/* Pending Approvals */}
                <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-amber-400" /> <T k="pending" /> ({pendingUsers.length})
                    </h3>
                    {pendingUsers.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 bg-white/3 rounded-xl"><T k="no_pending_requests" /></div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="flex justify-between items-center p-4 bg-white/3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <UserIcon size={20} className="text-gray-500" />
                                        <div>
                                            <div className="font-bold text-white">{user.name || t('no_name')} <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-2">{user.role}</span></div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all" onClick={() => handleAction(user.id, 'REJECT')} title={t('reject')}>
                                            <XCircle size={14} /> <T k="reject" />
                                        </button>
                                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm font-bold transition-all" onClick={() => handleAction(user.id, 'APPROVE')} title={t('approve')}>
                                            <CheckCircle size={14} /> <T k="approve" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Users Ranking Table */}
                <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <ListOrdered size={16} className="text-purple-400" /> <T k="personnel_ranking" /> ({processedUsers.length})
                    </h3>
                    {processedUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500"><T k="no_processed_users" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="pb-3 pr-4 pl-2 w-16 text-center"><T k="rank" /></th>
                                        <th className="pb-3 pr-4 w-24 text-center"><T k="adventurer" /></th>
                                        <th className="pb-3 pr-4"><T k="identity" /></th>
                                        <th className="pb-3 pr-4 text-center"><T k="role" /></th>
                                        <th className="pb-3 pr-4 pl-4 text-center"><T k="level" /></th>
                                        <th className="pb-3 pr-4 text-center"><T k="admin_status" /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedUsers.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-white/5 hover:bg-white/[0.06] transition-colors group cursor-pointer"
                                            onClick={() => openXpModal(user.id)}
                                            title={`View XP history for ${user.name}`}
                                        >
                                            <td className="py-3 pr-4 pl-2 text-center text-xl font-black text-white/50 group-hover:text-white transition-colors">#{index + 1}</td>
                                            <td className="py-3 pr-4 pl-4 pt-4">
                                                <AvatarDisplay characterId={user.characterId || 1} level={user.level || 1} size={100} />
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="font-bold text-lg text-white mb-1 group-hover:text-purple-300 transition-colors drop-shadow-sm">{user.name || '—'}</div>
                                                <div className="text-xs text-gray-500 font-mono bg-black/20 px-2 py-1 rounded inline-block">{user.email}</div>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${user.role === 'PM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-4 pl-4">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-[10px] text-gray-500 font-black tracking-widest mb-0.5"><T k="level" /></span>
                                                <span className="text-2xl font-black text-white">{user.level || 1}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-center">
                                            <span className={`text-xs font-bold ${
                                                user.status === 'APPROVED' ? 'text-emerald-400 border border-emerald-500/30 bg-emerald-500/10' :
                                                    user.status === 'REJECTED' ? 'text-red-400 border border-red-500/30 bg-red-500/10' :
                                                        'text-gray-400 border border-gray-500/30 bg-gray-500/10'
                                            } px-2 py-1 rounded-full`}>
                                                {user.status === 'APPROVED' ? t('approved') : user.status === 'REJECTED' ? t('rejected') : user.status}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-2 text-right">
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-purple-400 transition-colors inline-block" />
                                        </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
        </div>

            {/* XP Log Modal */}
            {xpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setXpModalOpen(false)}
                    />
                    {/* Modal */}
                    <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 flex flex-col overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                {xpModalUser && (
                                    <AvatarDisplay characterId={xpModalUser.characterId || 1} level={xpModalUser.level || 1} size={60} />
                                )}
                                <div>
                                    <h2 className="text-lg font-black text-white m-0">
                                        {xpModalUser?.name || '...'}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-purple-400 font-bold flex items-center gap-1">
                                            <Sparkles size={12} /> Lvl {xpModalUser?.level || 1}
                                        </span>
                                        <span className="text-xs text-gray-500 font-bold">
                                            {xpModalUser?.xp?.toLocaleString() || 0} XP total
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setXpModalOpen(false)}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {xpLogsLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                                    <span className="text-gray-500 text-sm">Loading XP history...</span>
                                </div>
                            ) : xpLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <History size={32} className="text-gray-600 mb-3" />
                                    <span className="text-gray-500 text-sm font-bold">No XP history yet</span>
                                    <span className="text-gray-600 text-xs mt-1">XP awards will appear here after the next report submission</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {xpLogs.map(log => {
                                        const date = new Date(log.createdAt);
                                        const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                                        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                        let breakdownItems: string[] = [];
                                        try { breakdownItems = log.breakdown ? JSON.parse(log.breakdown) : []; } catch { /* ignore */ }

                                        const sourceConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
                                            'daily_report': { label: 'Rapport Journalier', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
                                            'weekly_close': { label: 'Clôture Hebdo', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
                                            'manual_adjust': { label: 'Ajustement', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
                                        };
                                        const src = sourceConfig[log.source] || { label: log.source, color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' };

                                        return (
                                            <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                                {/* XP Amount */}
                                                <div className="flex flex-col items-center justify-center min-w-[60px]">
                                                    <span className={`text-xl font-black ${log.amount > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-bold">XP</span>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${src.color} ${src.bg} border ${src.border}`}>
                                                            {src.label}
                                                        </span>
                                                        {log.projectName && (
                                                            <span className="text-[11px] text-gray-500 font-bold truncate max-w-[200px]">
                                                                📁 {log.projectName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {breakdownItems.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {breakdownItems.map((item: string, i: number) => (
                                                                <span key={i} className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-md font-mono">
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Date */}
                                                <div className="flex flex-col items-end text-right min-w-[80px]">
                                                    <span className="text-xs text-gray-400 font-bold">{dateStr}</span>
                                                    <span className="text-[10px] text-gray-600">{timeStr}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center">
                            <span className="text-xs text-gray-600">
                                {xpLogs.length} {xpLogs.length === 1 ? 'entry' : 'entries'}
                            </span>
                            <button
                                onClick={() => setXpModalOpen(false)}
                                className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </main>
        </div>
    );
}
