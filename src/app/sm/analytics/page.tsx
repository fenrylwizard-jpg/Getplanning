import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp } from "lucide-react";
import { ProjectProgressChart, BenchmarkingChart } from "@/components/AnalyticsCharts";
import T from "@/components/T";

export const dynamic = 'force-dynamic';

export default async function SMAnalytics() {
    const smEmail = "sm@worksite.com";
    const user = await prisma.user.findUnique({
        where: { email: smEmail },
        include: {
            projectsAsSM: {
                include: {
                    tasks: true,
                },
            },
        },
    });

    if (!user) return <div><T k="user_not_found" /></div>;

    const progressData = user.projectsAsSM.map((proj) => {
        let totalLaborMinsTotal = 0;
        let totalLaborMinsAchieved = 0;

        proj.tasks.forEach((t) => {
            totalLaborMinsTotal += (t.quantity * t.minutesPerUnit);
            totalLaborMinsAchieved += (t.completedQuantity * t.minutesPerUnit);
        });

        return {
            name: proj.name,
            totalHours: parseFloat((totalLaborMinsTotal / 60).toFixed(1)),
            achievedHours: parseFloat((totalLaborMinsAchieved / 60).toFixed(1)),
        };
    });

    // Cross-Project Benchmarking Data
    const allProjects = await prisma.project.findMany({
        include: { tasks: true, siteManager: true }
    });

    const benchmarkData = allProjects.map(proj => {
        let totalTotal = 0;
        let totalAchieved = 0;
        proj.tasks.forEach(t => {
            totalTotal += (t.quantity * t.minutesPerUnit);
            totalAchieved += (t.completedQuantity * t.minutesPerUnit);
        });
        
        const efficiency = totalTotal > 0 ? (totalAchieved / totalTotal) * 100 : 0;
        const isMine = proj.siteManager?.email === smEmail;
        
        return {
            name: isMine ? `Vous (${proj.name})` : `Projet #${proj.id.substring(0, 4)} (Anonyme)`,
            efficiency: parseFloat(efficiency.toFixed(1)),
            isMine
        };
    }).sort((a, b) => b.efficiency - a.efficiency);

    return (
        <div className="min-h-screen aurora-page flex flex-col items-center w-full sm:p-20 font-[family-name:var(--font-geist-sans)] pb-24">

            <main className="max-w-5xl w-full px-6 sm:px-8 py-10 sm:py-16 relative z-10 flex flex-col items-center gap-12">
                <div className="mb-12">
                    <h1 className="flex items-center gap-3 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.3)] uppercase tracking-tight">
                        <BarChart3 size={40} className="text-cyan-400" /> <T k="my_statistics" />
                    </h1>
                    <p className="mt-4 text-gray-400 text-lg font-medium tracking-wide"><T k="statistics_overview" /></p>
                </div>

                <div className="mechanical-panel p-10 mb-12 relative overflow-hidden group">
                    <div className="shape-container right-[-20px] top-[-20px] scale-75 opacity-50">
                        <div className="css-holo-core"></div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="mb-8 text-3xl font-black text-white flex items-center gap-3 drop-shadow-md tracking-tight"><TrendingUp size={28} className="text-pink-400" /> <T k="projects_progress_hours" /></h3>
                        <div className="bg-black/20 backdrop-blur-md rounded-md p-4 border border-white/5">
                            <ProjectProgressChart data={progressData} />
                        </div>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-pink-500/80 shadow-[0_0_20px_rgba(236,72,153,1)] opacity-70"></div>
                </div>

                <div className="mechanical-panel p-10 mb-12 relative overflow-hidden group">
                    <div className="shape-container right-[-10px] top-[-10px] scale-75 opacity-50">
                        <div className="css-data-pillar"></div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="mb-4 text-3xl font-black text-white flex items-center gap-3 drop-shadow-md tracking-tight"><BarChart3 size={28} className="text-cyan-400" /> <T k="benchmarking_title" /></h3>
                        <p className="text-lg text-gray-300 mb-8 font-medium drop-shadow-sm"><T k="benchmarking_desc" /></p>
                        <div className="bg-black/20 backdrop-blur-md rounded-md p-4 border border-white/5">
                            <BenchmarkingChart data={benchmarkData} />
                        </div>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,1)] opacity-70"></div>
                </div>
            </main>
        </div>
    );
}
