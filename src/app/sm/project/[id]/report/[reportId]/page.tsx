import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Users, Clock, CheckCircle2, AlertTriangle, FileText, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DailyReportDetail({ params }: { params: Promise<{ id: string; reportId: string }> }) {
    const { id, reportId } = await params;

    const report = await prisma.dailyReport.findUnique({
        where: { id: reportId },
        include: {
            taskProgress: {
                include: {
                    task: true,
                }
            },
            project: true,
        }
    });

    if (!report) {
        return (
            <div className="aurora-page text-white font-sans flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-2xl font-black mb-4">Rapport introuvable</p>
                    <Link href={`/sm/project/${id}/plan/history`} className="text-cyan-400 hover:underline">← Retour</Link>
                </div>
            </div>
        );
    }

    const reportDate = new Date(report.date);
    const dayName = reportDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dateStr = reportDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Calculate totals
    const totalStandardHours = report.taskProgress.reduce((acc, p) => acc + (p.hours || 0), 0);
    const totalUnits = report.taskProgress.reduce((acc, p) => acc + p.quantity, 0);

    // Efficiency: achieved standard hours vs (workers × 8h expected)
    const workersCount = report.workersCount || 1;
    const expectedHours = workersCount * 8;
    const efficiency = expectedHours > 0 ? (totalStandardHours / expectedHours) * 100 : 0;



    return (
        <div className="aurora-page text-white font-sans min-h-screen">
            <nav className="navbar border-b border-white/5 bg-[#0a1020]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex items-center justify-between py-4">
                    <Link href={`/sm/project/${id}/plan/history`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ArrowLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Retour Historique</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400"><FileText size={18} /></div>
                        <h1 className="text-xl font-black tracking-tighter">Rapport Journalier</h1>
                    </div>
                </div>
            </nav>

            <main className="container max-w-4xl py-12 px-4">
                {/* Header */}
                <div className="mb-10">
                    <h2 className="text-3xl font-black capitalize mb-1">{dayName}</h2>
                    <p className="text-gray-400 text-sm">{dateStr} — {report.project?.name}</p>

                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="glass-panel p-5 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl text-center">
                        <Users size={18} className="text-cyan-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{workersCount}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Travailleurs</div>
                    </div>
                    <div className="glass-panel p-5 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl text-center">
                        <Clock size={18} className="text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{totalStandardHours.toFixed(1)}<span className="text-sm text-gray-500">H</span></div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Heures Standard</div>
                    </div>
                    <div className="glass-panel p-5 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl text-center">
                        <TrendingUp size={18} className="text-amber-400 mx-auto mb-2" />
                        <div className={`text-2xl font-black ${efficiency >= 100 ? 'text-emerald-400' : efficiency >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                            {efficiency.toFixed(1)}<span className="text-sm text-gray-500">%</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Efficience</div>
                    </div>
                    <div className="glass-panel p-5 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl text-center">
                        <CheckCircle2 size={18} className="text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{totalUnits}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">Unités Réalisées</div>
                    </div>
                </div>

                {/* Efficiency Bar */}
                <div className="glass-panel p-6 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl mb-10">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Efficience du jour</span>
                        <span className={`text-sm font-black ${efficiency >= 100 ? 'text-emerald-400' : efficiency >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                            {efficiency.toFixed(1)}% ({totalStandardHours.toFixed(1)}H / {expectedHours}H attendues)
                        </span>
                    </div>
                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-700 ${efficiency >= 100 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : efficiency >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                            style={{ width: `${Math.min(efficiency, 150)}%` }}
                        />
                    </div>
                </div>

                {/* Task Details */}
                <section className="mb-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500" /> Détail des tâches
                    </h3>
                    <div className="flex flex-col gap-4">
                        {report.taskProgress.map((progress, idx) => {
                            const task = progress.task;
                            const standardHours = progress.hours || 0;

                            return (
                                <div key={progress.id || idx} className="glass-panel p-5 rounded-md border border-white/5 bg-[#0a1020]/60 backdrop-blur-xl hover:border-cyan-500/20 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white text-base">{task?.description || 'Tâche supprimée'}</h4>
                                            {task?.category && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md mt-1 inline-block">{task.category}</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white">{progress.quantity} <span className="text-xs text-gray-500">{task?.unit || 'u'}</span></div>
                                            <div className="text-xs text-gray-500">{standardHours.toFixed(1)}H standard</div>
                                        </div>
                                    </div>
                                    {task?.minutesPerUnit && (
                                        <div className="text-xs text-gray-500">
                                            Cadence: {task.minutesPerUnit} min/{task.unit || 'u'} • 
                                            {progress.quantity > 0 && task.minutesPerUnit > 0 && ` ${((progress.quantity * task.minutesPerUnit) / 60).toFixed(1)}H de travail standard`}
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Remarks */}
                {report.remarks && (
                    <section className="mb-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={14} /> Remarques / Problèmes
                        </h3>
                        <div className="glass-panel p-5 rounded-md border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{report.remarks}</p>
                        </div>
                    </section>
                )}



                {/* Late/Blockage Info */}
                {report.lateReason && (
                    <section className="mb-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={14} /> Rapport en retard
                        </h3>
                        <div className="glass-panel p-5 rounded-md border border-red-500/20 bg-red-500/5 backdrop-blur-xl">
                            <p className="text-sm text-gray-300">
                                <span className="font-bold text-red-400">Raison:</span> {report.lateReason}
                                {report.lateDescription && <><br />{report.lateDescription}</>}
                            </p>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
