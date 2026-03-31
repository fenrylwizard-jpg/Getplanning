import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-auth-user";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, History } from "lucide-react";
import T from "@/components/T";
import { AdminDeletePlanButton, AdminDeleteReportButton } from "./AdminDeleteButtons";
import WeeklyExpandable from "./WeeklyExpandable";
import { getISOWeek, getISOWeekYear } from "date-fns";

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'admin@eeg.be';

export default async function SMHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [project, authUser] = await Promise.all([
        prisma.project.findUnique({
            where: { id },
            include: {
                weeklyPlans: {
                    orderBy: [
                        { year: 'desc' },
                        { weekNumber: 'desc' }
                    ],
                    include: {
                        tasks: { include: { task: true } }
                    }
                },
                dailyReports: {
                    orderBy: { date: 'desc' },
                    include: {
                        taskProgress: { include: { task: true } }
                    }
                }
            }
        }),
        getAuthUser()
    ]);

    if (!project) return <div className="p-8 text-center text-white"><T k="project_not_found" /></div>;

    const isAdmin = authUser?.email === ADMIN_EMAIL;
    const allPlans = project.weeklyPlans;
    const allReports = project.dailyReports || [];

    // Group daily reports by ISO week for pairing with weekly plans
    const reportsByWeek = new Map<string, typeof allReports>();
    for (const report of allReports) {
        const d = new Date(report.date);
        const wk = getISOWeek(d);
        const yr = getISOWeekYear(d);
        const key = `${yr}-${wk}`;
        if (!reportsByWeek.has(key)) reportsByWeek.set(key, []);
        reportsByWeek.get(key)!.push(report);
    }

    // Serialize data for client components (dates need to be strings)
    const serializeReports = (reports: typeof allReports) => reports.map(r => ({
        id: r.id,
        date: r.date.toISOString(),
        remarks: r.remarks,
        status: r.status,
        lateReason: r.lateReason,
        lateDescription: r.lateDescription,
        workersCount: r.workersCount,
        taskProgress: r.taskProgress.map(tp => ({
            id: tp.id,
            quantity: tp.quantity,
            hours: tp.hours,
            task: {
                description: tp.task.description,
                unit: tp.task.unit,
                minutesPerUnit: tp.task.minutesPerUnit,
                category: tp.task.category,
            }
        }))
    }));

    const serializePlan = (plan: typeof allPlans[0]) => ({
        id: plan.id,
        weekNumber: plan.weekNumber,
        year: plan.year,
        numberOfWorkers: plan.numberOfWorkers,
        isSubmitted: plan.isSubmitted,
        targetReached: plan.targetReached,
        issuesReported: plan.issuesReported,
        missedTargetReason: plan.missedTargetReason,
        tasks: plan.tasks.map(t => ({
            id: t.id,
            plannedQuantity: t.plannedQuantity,
            actualQuantity: t.actualQuantity,
            task: {
                description: t.task.description,
                unit: t.task.unit,
                minutesPerUnit: t.task.minutesPerUnit,
                category: t.task.category,
            }
        }))
    });

    return (
        <div className="aurora-page text-white font-sans">
            <nav className="navbar border-b border-white/5 bg-[#0a1020]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex items-center justify-between py-4">
                    <Link href="/sm/dashboard" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ArrowLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest"><T k="back_to_dashboard" /></span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400"><History size={18} /></div>
                        <h1 className="text-xl font-black tracking-tighter"><T k="project_history" /></h1>
                    </div>
                </div>
            </nav>

            <main className="container max-w-4xl py-12">
                <div className="mb-12">
                    <h2 className="text-3xl font-black mb-2">{project.name}</h2>
                    <p className="text-gray-500 text-sm"><T k="history_desc" /></p>
                    {isAdmin && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 w-fit">
                            <ShieldAlert size={14} className="text-red-400" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Admin Mode — Édition activée</span>
                        </div>
                    )}
                </div>

                {/* Weekly Plans with Inline Daily Reports */}
                <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                         <T k="submitted_reports" />
                    </h3>
                    {allPlans.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-gray-600 italic rounded-[40px]">
                            <T k="no_history_yet" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {allPlans.map(plan => {
                                const weekKey = `${plan.year}-${plan.weekNumber}`;
                                const weekReports = reportsByWeek.get(weekKey) || [];

                                return (
                                    <div key={plan.id} className="relative">
                                        <WeeklyExpandable
                                            plan={serializePlan(plan)}
                                            projectId={id}
                                            weekReports={serializeReports(weekReports)}
                                            isAdmin={isAdmin}
                                        />
                                        {isAdmin && <AdminDeletePlanButton planId={plan.id} projectId={id} weekNumber={plan.weekNumber} year={plan.year} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Orphan Daily Reports (not matched to any weekly plan) */}
                {(() => {
                    const planWeeks = new Set(allPlans.map(p => `${p.year}-${p.weekNumber}`));
                    const orphanReports = allReports.filter(r => {
                        const d = new Date(r.date);
                        const key = `${getISOWeekYear(d)}-${getISOWeek(d)}`;
                        return !planWeeks.has(key);
                    });

                    if (orphanReports.length === 0) return null;

                    return (
                        <section className="mt-12 pt-12 border-t border-white/5">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2">
                                Rapports non associés à un plan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {orphanReports.map(report => {
                                    const totalHours = report.taskProgress.reduce((acc, p) => acc + (p.hours || 0), 0);
                                    return (
                                        <div key={report.id} className="relative">
                                            <Link href={`/sm/project/${id}/report/${report.id}`} className="block glass-panel p-4 border border-white/5 hover:border-cyan-500/30 bg-[#0a1020]/60 backdrop-blur-xl transition-all rounded-md flex justify-between items-center group overflow-hidden cursor-pointer">
                                                <div className="relative z-10 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black text-white leading-none">
                                                            {new Date(report.date).getUTCDate().toString().padStart(2, '0')}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-cyan-400 uppercase">
                                                            {new Date(report.date).toLocaleString('default', { month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white mb-1 capitalize">
                                                            {new Date(report.date).toLocaleDateString('default', { weekday: 'long' })}
                                                        </div>
                                                        <div className="flex gap-3 text-xs text-gray-400 font-medium">
                                                            <span>{report.workersCount || 0} travailleurs</span>
                                                            <span>{totalHours.toFixed(1)}H</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            {isAdmin && <AdminDeleteReportButton reportId={report.id} projectId={id} reportDate={report.date.toISOString()} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })()}
            </main>
        </div>
    );
}
