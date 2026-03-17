import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FolderKey, MapPin, Users, UploadCloud } from "lucide-react";
import { Suspense } from "react";
import T from "@/components/T";
import ProjectHubTabs from "@/components/ProjectHubTabs";
import OverviewTab from "@/components/hub/OverviewTab";
import FinancesTab from "@/components/hub/FinancesTab";
import AchatsTab from "@/components/hub/AchatsTab";
import ProductionTab from "@/components/hub/ProductionTab";
import DossierTechniqueTab from "@/components/hub/DossierTechniqueTab";
import PlanningTab from "@/components/hub/PlanningTab";

export const dynamic = 'force-dynamic';

export default async function ProjectHub({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
    const resolvedParams = await params;
    const resolvedSearch = await searchParams;
    const id = resolvedParams.id;
    const activeTab = resolvedSearch.tab || "overview";

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            projectManager: true,
            siteManager: true,
            tasks: true,
            weeklyPlans: {
                orderBy: { createdAt: 'desc' },
                include: {
                    tasks: { include: { task: true } }
                }
            },
            revisions: {
                orderBy: { uploadedAt: 'desc' }
            }
        }
    });

    if (!project) return <div className="p-8 text-center text-red-400 font-bold"><T k="project_not_found" /></div>;

    return (
        <div className="aurora-page min-h-screen text-white flex flex-col items-center w-full">
            {/* Project Header */}
            <div className="bg-[#060b18]/90 border-b border-white/5 w-full flex justify-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
                    <Link href="/pm/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group w-fit">
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/5 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-sm font-bold"><T k="back_to_dashboard" /></span>
                    </Link>

                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-black text-white">
                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <FolderKey size={24} className="text-purple-400" />
                                </div>
                                {project.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                <span className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                    <Users size={14} className="text-amber-400" />
                                    <span className="text-gray-400">PM:</span> <span className="text-amber-300 font-bold">{project.projectManager?.name || '—'}</span>
                                </span>
                                <span className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                    <Users size={14} className="text-cyan-400" />
                                    <span className="text-gray-400">SM:</span> <span className="text-cyan-300 font-bold">{project.siteManager?.name || <T k="unassigned" />}</span>
                                </span>
                                <span className="flex items-center gap-2 text-sm text-gray-400">
                                    <MapPin size={14} className="text-gray-500" />
                                    {project.location || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <Link href={`/pm/project/${id}/reupload`} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-sm hover:bg-blue-500/20 transition-all">
                            <UploadCloud size={18} /> Mettre à jour
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hub Navigation — always visible, animates between expanded/compact */}
            <Suspense fallback={<div className="h-12" />}>
                <ProjectHubTabs projectId={id} activeTab={activeTab} />
            </Suspense>

            {/* Tab Content */}
            <div className="max-w-7xl w-full px-4 sm:px-8 py-8">
                {activeTab === "overview" && <OverviewTab project={project as unknown as React.ComponentProps<typeof OverviewTab>['project']} />}
                {activeTab === "finances" && <FinancesTab project={project as unknown as React.ComponentProps<typeof FinancesTab>['project']} />}
                {activeTab === "achats" && <AchatsTab project={project as unknown as React.ComponentProps<typeof AchatsTab>['project']} />}
                {activeTab === "production" && <ProductionTab project={project as unknown as React.ComponentProps<typeof ProductionTab>['project']} />}
                {activeTab === "technique" && <DossierTechniqueTab project={project as unknown as React.ComponentProps<typeof DossierTechniqueTab>['project']} />}
                {activeTab === "planning" && <PlanningTab project={project as unknown as React.ComponentProps<typeof PlanningTab>['project']} />}
            </div>
        </div>
    );
}
