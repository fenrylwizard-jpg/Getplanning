import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FolderKey } from "lucide-react";
import ProjectAnalyticsCharts from "@/components/ProjectAnalyticsCharts";

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

    const completionPercentage = totalLaborMinsTotal ? (totalLaborMinsAchieved / totalLaborMinsTotal) * 100 : 0;

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
                    <div className="w-full h-6 bg-[var(--bg-primary)] rounded-md overflow-hidden relative">
                        <div className="absolute h-full transition-all duration-1000 ease-out bg-gradient-to-r from-[var(--accent-hover)] to-[var(--accent-primary)] progress-bar-sm"></div>
                        <div className="absolute w-full h-full flex items-center justify-center text-[0.8rem] font-bold text-white drop-shadow-md">
                            {completionPercentage.toFixed(1)}% Terminé
                        </div>
                    </div>
                </div>

                <ProjectAnalyticsCharts tasks={project.tasks} weeklyPlans={project.weeklyPlans} dailyReports={project.dailyReports} />

            </main>
        </>
    );
}
