"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ShieldCheck, CheckCircle, XCircle, Clock, UserIcon, LogOut,
    TrendingUp, Euro, Activity, Folder, Target, RefreshCw, Globe, ListOrdered, Trash2, AlertTriangle, Eye, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import AvatarDisplay from '@/components/AvatarDisplay';
import T from '@/components/T';
import { useTranslation } from '@/lib/LanguageContext';
import AdminWeeklyGraph from '@/components/AdminWeeklyGraph';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityLog {
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    user: { name: string; role: string; };
}

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

export default function AdminDashboard() {
    const router = useRouter();
    const { t } = useTranslation();
    const [users, setUsers] = useState<{ id: string, name: string, email: string, role: string, status: string, level?: number, characterId?: number, lastActiveAt?: string }[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [cronRunning, setCronRunning] = useState(false);
    const [cronResult, setCronResult] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'project'; id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [usersRes, statsRes, logsRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/stats'),
                fetch('/api/admin/activity')
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
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setLogs(logsData.logs || []);
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

    const handleDeleteUser = async (userId: string) => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Utilisateur supprimé ✓');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur lors de la suppression');
            }
        } catch {
            toast.error('Erreur serveur');
        } finally {
            setDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/project/${projectId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Projet supprimé ✓');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur lors de la suppression');
            }
        } catch {
            toast.error('Erreur serveur');
        } finally {
            setDeleting(false);
            setDeleteConfirm(null);
        }
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
        <div className="aurora-page min-h-screen flex items-center justify-center text-white">
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
            <main className="min-h-screen bg-black/40 backdrop-blur-sm text-white px-6 py-10 w-full max-w-7xl flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-purple-600 flex items-center justify-center">
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
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-bold disabled:opacity-50"
                        title={t('close_week')}
                    >
                        <RefreshCw size={16} className={cronRunning ? 'animate-spin' : ''} />
                        <T k="close_week" />
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all text-sm font-bold"
                        onClick={handleLogout}
                        title={t('logout')}
                    >
                        <LogOut size={16} /> <T k="logout" />
                    </button>
                </div>
            </div>

            {cronResult && (
                <div className="mb-6 px-4 py-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
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
                        <div key={label} className={`${bg} border border-white/10 rounded-md p-5 flex items-center gap-4`}>
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
                    <div className="glass-card mb-0">
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

                    <div className="glass-card mb-0">
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
                <div className="glass-card mb-8">
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
                                    <th className="pb-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.projects.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                        <td className="py-3 pr-4 font-bold text-white"><Link href={`/pm/project/${p.id}`} className="hover:text-purple-400 transition-colors underline decoration-white/20 hover:decoration-purple-400">{p.name}</Link></td>
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
                                        <td className="py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={`/admin/project/${p.id}`}
                                                    className="p-1.5 rounded-lg border border-amber-500/20 text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
                                                    title="Configuration du projet"
                                                >
                                                    <Settings size={14} />
                                                </Link>
                                                <Link
                                                    href={`/sm/project/${p.id}/plan/history`}
                                                    className="p-1.5 rounded-lg border border-cyan-500/20 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all"
                                                    title="Vue SM (Historique)"
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                <Link
                                                    href={`/pm/project/${p.id}`}
                                                    className="p-1.5 rounded-lg border border-purple-500/20 text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all"
                                                    title="Vue PM"
                                                >
                                                    <Folder size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteConfirm({ type: 'project', id: p.id, name: p.name })}
                                                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all"
                                                    title="Supprimer le projet"
                                                >
                                                    <Trash2 size={14} />
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
                <div className="bg-[#080d1a] border border-white/5 rounded-md p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-amber-400" /> <T k="pending" /> ({pendingUsers.length})
                    </h3>
                    {pendingUsers.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 bg-white/3 rounded-md"><T k="no_pending_requests" /></div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="flex justify-between items-center p-4 bg-white/3 rounded-md border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <UserIcon size={20} className="text-gray-500" />
                                        <div>
                                            <div className="font-bold text-white">{user.name || t('no_name')} <span className="text-xs bg-white/10 px-2 py-0.5 rounded-sm ml-2">{user.role}</span></div>
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
                <div className="bg-[#080d1a] border border-white/5 rounded-md p-6">
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
                                        <th className="pb-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedUsers.map((user, index) => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                                            <td className="py-3 pr-4 pl-2 text-center text-xl font-black text-white/50 group-hover:text-white transition-colors">#{index + 1}</td>
                                            <td className="py-3 pr-4 pl-4 pt-4">
                                                <AvatarDisplay characterId={user.characterId || 1} level={user.level || 1} size={64} showLevel={false} />
                                            </td>
                                            <td className="py-3 pr-4">
                                                <Link href={`/user/${user.id}`} className="block hover:opacity-80 transition-opacity">
                                                    <div className="font-bold text-lg text-white mb-1 group-hover:text-purple-300 transition-colors drop-shadow-sm flex items-center gap-2">
                                                        {user.name || '—'}
                                                        {user.lastActiveAt && (new Date().getTime() - new Date(user.lastActiveAt).getTime()) < 5 * 60 * 1000 && (
                                                            <span className="flex h-2.5 w-2.5 relative" title="En ligne">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono bg-black/20 px-2 py-1 rounded inline-block">{user.email}</div>
                                                </Link>
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`text-xs px-3 py-1 rounded-sm font-bold shadow-sm ${user.role === 'PM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
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
                                            } px-2 py-1 rounded-sm`}>
                                                {user.status === 'APPROVED' ? t('approved') : user.status === 'REJECTED' ? t('rejected') : user.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <button
                                                onClick={() => setDeleteConfirm({ type: 'user', id: user.id, name: user.name || user.email })}
                                                className="p-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all"
                                                title="Supprimer l'utilisateur"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Activity Logs */}
                <div className="bg-[#080d1a] border border-white/5 rounded-md p-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-blue-400" /> Journal d&apos;Activité
                    </h3>
                    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {logs.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">Aucune activité récente.</div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="flex gap-4 p-3 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors items-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <Activity size={14} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <div className="font-bold text-sm text-white truncate">
                                                {log.user.name} <span className="text-xs font-normal text-gray-400 ml-1">({log.user.role})</span>
                                            </div>
                                            <div className="text-xs text-gray-500 shrink-0 capitalize">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-blue-300/80 mb-1">{log.action}</div>
                                        {log.details && (
                                            <div className="text-xs text-gray-400 break-words leading-relaxed">
                                                {log.details.length > 150 ? log.details.substring(0, 150) + '...' : log.details}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
        </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)}>
                    <div className="bg-[#0c1225] border border-white/10 rounded-md p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                <AlertTriangle size={24} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Confirmer la suppression</h3>
                                <p className="text-xs text-gray-500">Cette action est irréversible</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-6">
                            Voulez-vous vraiment supprimer {deleteConfirm.type === 'user' ? "l'utilisateur" : 'le projet'}{' '}
                            <strong className="text-white">{deleteConfirm.name}</strong> ?
                            {deleteConfirm.type === 'user' && (
                                <span className="block mt-2 text-red-400/80 text-xs">Toutes les données associées (projets PM, badges, données cuisine) seront également supprimées.</span>
                            )}
                            {deleteConfirm.type === 'project' && (
                                <span className="block mt-2 text-red-400/80 text-xs">Tous les rapports, tâches, plans et données associées seront supprimés.</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all font-bold text-sm disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirm.type === 'user') handleDeleteUser(deleteConfirm.id);
                                    else handleDeleteProject(deleteConfirm.id);
                                }}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleting ? (
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <><Trash2 size={14} /> Supprimer</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
    );
}
