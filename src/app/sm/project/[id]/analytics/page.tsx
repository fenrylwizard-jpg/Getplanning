import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FolderKey, TrendingUp, Clock } from "lucide-react";
import ProjectAnalyticsCharts from "@/components/ProjectAnalyticsCharts";
import { getISOWeek, getISOWeekYear } from "date-fns";

export default async function SMProjectAnalytics({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
            siteManager: true,
            tasks: true,
            weeklyPlans: {
                orderBy: { createdAt: 'desc' },
                include: {
                    tasks: { include: { task: true } }
                }
            },
            dailyReports: {
                where: { status: 'SUBMITTED' },
                orderBy: { date: 'asc' },
                include: {
                    taskProgress: { include: { task: true } }
                }
            }
        }
    });

    if (!project) return <div>Projet introuvable</div>;

    // Global Progress metrics
    const totalTasksLoaded = project.tasks.length;
    let totalLaborMinsTotal = 0;
    let totalLaborMinsAchieved = 0;

    project.tasks.forEach((t) => {
        totalLaborMinsTotal += (t.quantity * t.minutesPerUnit);
        totalLaborMinsAchieved += (t.completedQuantity * t.minutesPerUnit);
    });

    let globalUsedHours = 0;
    let globalEarnedFromReports = 0;
    
    // Lookup hoursPerWorker by week for accurate daily hours
    const planHoursLookup = new Map<string, number>();
    project.weeklyPlans.forEach(p => {
        planHoursLookup.set(`${p.year}-${p.weekNumber}`, (p as any).hoursPerWorker || 40);
    });

    if (project.dailyReports) {
        for (const report of project.dailyReports) {
            if (report.status !== 'DRAFT') {
                if (report.workersCount) {
                    const d = new Date(report.date);
                    const wk = getISOWeek(d);
                    const yr = getISOWeekYear(d);
                    const key = `${yr}-${wk}`;
                    
                    const weeklyHoursPerWorker = planHoursLookup.get(key) || 40;
                    const dailyHoursPerWorker = weeklyHoursPerWorker / 5;
                    globalUsedHours += report.workersCount * dailyHoursPerWorker;
                }
                
                report.taskProgress.forEach(tp => {
                    globalEarnedFromReports += tp.hours || 0;
                });
            }
        }
    }

    const earnedHoursTotal = totalLaborMinsAchieved / 60;
    const globalEfficiencyPct = globalUsedHours > 0 ? (globalEarnedFromReports / globalUsedHours) * 100 : 0;
    const globalHoursLost = globalUsedHours - globalEarnedFromReports;

    const completionPercentage = totalLaborMinsTotal ? (earnedHoursTotal / (totalLaborMinsTotal / 60)) * 100 : 0;

    return (
        <>
            <nav className="navbar">
                <div className="container nav-content">
                    <Link href="/sm/dashboard" className="nav-brand"><ArrowLeft size={20} /> Retour au Tableau de Bord</Link>
                    <div className="nav-links">
                        <span className="badge badge-success">Analyses Chef de Chantier</span>
                    </div>
                </div>
            </nav>

            <main className="main-content container mt-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center gap-3"><FolderKey size={28} className="text-secondary" /> {project.name}</h1>
                            <p className="mt-2 text-secondary">
                                Emplacement : {project.location || 'N/A'} • Vous êtes le Chef de Chantier
                            </p>
                        </div>
                    </div>
                </div>

                {/* Global Progress */}
                <div className="glass-panel mb-8">
                    <h3 className="mb-4">Progression Globale du Budget</h3>
                    <div className="grid grid-cols-3 gap-8 text-center mb-6">
                        <div>
                            <div className="text-secondary text-sm">Total des heures de travail prévues</div>
                            <div className="text-[1.5rem] font-semibold">{(totalLaborMinsTotal / 60).toFixed(0)} heures</div>
                        </div>
                        <div>
                            <div className="text-secondary text-sm">Valeur de travail atteinte</div>
                            <div className="text-[1.5rem] font-semibold text-accent-primary">{(totalLaborMinsAchieved / 60).toFixed(0)} heures</div>
                        </div>
                        <div>
                            <div className="text-secondary text-sm">Tâches Suivies</div>
                            <div className="text-[1.5rem] font-semibold">{totalTasksLoaded}</div>
                        </div>
                    </div>

                    <style>{`
                        .progress-bar-sm { width: ${completionPercentage}%; }
                    `}</style>
                    <div className="w-full h-6 bg-[var(--bg-primary)] rounded-md overflow-hidden relative mb-6">
                        <div className="absolute h-full transition-all duration-1000 ease-out bg-gradient-to-r from-[var(--accent-hover)] to-[var(--accent-primary)] progress-bar-sm"></div>
                        <div className="absolute w-full h-full flex items-center justify-center text-[0.8rem] font-bold text-white drop-shadow-md">
                            {completionPercentage.toFixed(1)}% Terminé
                        </div>
                    </div>
                    
                    {/* Global Efficiency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0a1020]/80 border border-white/5 rounded-md p-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${globalEfficiencyPct >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Efficience Globale</div>
                                <div className={`text-2xl font-black ${globalEfficiencyPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {globalEfficiencyPct > 0 ? `${globalEfficiencyPct.toFixed(1)} %` : 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        <div className={`border rounded-md p-4 flex items-center gap-4 ${globalHoursLost <= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${globalHoursLost <= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Heures Perdues (Dépensées - Gagnées)</div>
                                <div className={`text-2xl font-black ${globalHoursLost <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {globalHoursLost > 0 ? '+' : ''}{globalHoursLost.toFixed(1)} h
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ProjectAnalyticsCharts tasks={project.tasks} weeklyPlans={project.weeklyPlans} dailyReports={project.dailyReports} />

            </main>
        </>
    );
}
