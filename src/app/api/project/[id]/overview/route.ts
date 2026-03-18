import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;

    try {
        // ── 1. Production: avancement global + top 5 catégories ──
        const tasks = await prisma.task.findMany({
            where: { projectId },
            select: {
                category: true,
                quantity: true,
                completedQuantity: true,
                minutesPerUnit: true,
                status: true,
            },
        });

        const activeTasks = tasks.filter(t => t.status === "ACTIVE").length;

        // Global progress: total completed hours / total planned hours
        let totalPlannedMinutes = 0;
        let totalCompletedMinutes = 0;
        const categoryMap = new Map<string, { planned: number; completed: number }>();

        for (const t of tasks) {
            const planned = t.quantity * t.minutesPerUnit;
            const completed = t.completedQuantity * t.minutesPerUnit;
            totalPlannedMinutes += planned;
            totalCompletedMinutes += completed;

            const existing = categoryMap.get(t.category) || { planned: 0, completed: 0 };
            existing.planned += planned;
            existing.completed += completed;
            categoryMap.set(t.category, existing);
        }

        const avancementGlobal = totalPlannedMinutes > 0
            ? Math.round((totalCompletedMinutes / totalPlannedMinutes) * 100 * 10) / 10
            : 0;

        // Top 5 categories by total planned hours (descending)
        const productionTop5 = Array.from(categoryMap.entries())
            .map(([category, { planned, completed }]) => ({
                category,
                progress: planned > 0 ? Math.round((completed / planned) * 100 * 10) / 10 : 0,
                totalHours: Math.round(planned / 60),
            }))
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 5);

        // ── 2. Finances: latest snapshot ──
        const latestFinance = await prisma.financeSnapshot.findFirst({
            where: { projectId },
            orderBy: { month: "desc" },
            select: {
                totalRevenue: true,
                totalCost: true,
                result: true,
                marginPercent: true,
            },
        });

        const budgetConsomme = latestFinance?.totalRevenue && latestFinance?.totalCost
            ? Math.round((latestFinance.totalCost / latestFinance.totalRevenue) * 100 * 10) / 10
            : null;

        // ── 3. Planning: next milestone ──
        const nextMilestone = await prisma.planningMilestone.findFirst({
            where: {
                projectId,
                isComplete: false,
                endDate: { gte: new Date() },
            },
            orderBy: { endDate: "asc" },
            select: { name: true, endDate: true },
        });

        // ── 4. Études: document approval stats ──
        const allDocs = await prisma.etudeDocument.findMany({
            where: { projectId },
            select: { status: true },
        });

        const totalDocs = allDocs.length;
        const approved = allDocs.filter(d => d.status === "APP").length;
        const approvedWithRemarks = allDocs.filter(d => d.status === "BPE").length;
        const approvedPct = totalDocs > 0
            ? Math.round(((approved + approvedWithRemarks) / totalDocs) * 100 * 10) / 10
            : 0;

        // ── 5. Achats: budget summary ──
        const purchases = await prisma.purchaseCategory.findMany({
            where: { projectId },
            select: {
                offerPriceSoum: true,
                negotiatedPrice: true,
                returnAmount: true,
            },
        });

        let totalBudget = 0;
        let totalNegotiated = 0;
        let totalReturn = 0;
        for (const p of purchases) {
            totalBudget += p.offerPriceSoum || 0;
            totalNegotiated += p.negotiatedPrice || 0;
            totalReturn += p.returnAmount || 0;
        }

        return NextResponse.json({
            kpis: {
                avancementGlobal,
                budgetConsomme,
                tachesActives: activeTasks,
                prochaineEcheance: nextMilestone
                    ? { name: nextMilestone.name, date: nextMilestone.endDate.toISOString() }
                    : null,
            },
            productionTop5,
            finances: latestFinance
                ? {
                    result: latestFinance.result,
                    marginPercent: latestFinance.marginPercent,
                    totalRevenue: latestFinance.totalRevenue,
                    totalCost: latestFinance.totalCost,
                }
                : null,
            etudes: {
                totalDocs,
                approved,
                approvedWithRemarks,
                approvedPct,
            },
            achats: {
                totalBudget: Math.round(totalBudget),
                totalNegotiated: Math.round(totalNegotiated),
                totalReturn: Math.round(totalReturn),
            },
        });
    } catch (error) {
        console.error("Overview API error:", error);
        return NextResponse.json({ error: "Failed to load overview data" }, { status: 500 });
    }
}
