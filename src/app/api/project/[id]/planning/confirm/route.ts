import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Sanitize a date string — reject dates with year outside 1900-2100.
 * Returns a valid Date or null if unparseable.
 */
function sanitizeDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        if (year < 1900 || year > 2100) return null;
        return d;
    } catch {
        return null;
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    try {
        const body = await req.json();
        const { milestones } = body;

        if (!milestones || !Array.isArray(milestones)) {
            return NextResponse.json({ error: "No milestones provided" }, { status: 400 });
        }

        // We delete all existing planning milestones for this project and insert the new ones
        await prisma.$transaction(async (tx) => {
            // Delete old ones
            await tx.planningMilestone.deleteMany({
                where: { projectId: id }
            });

            // Insert new ones, skip milestones with invalid dates
            let skipped = 0;
            for (let i = 0; i < milestones.length; i++) {
                const m = milestones[i];
                const startDate = sanitizeDate(m.startDate);
                const endDate = sanitizeDate(m.endDate);

                if (!startDate || !endDate) {
                    skipped++;
                    continue;
                }

                await tx.planningMilestone.create({
                    data: {
                        projectId: id,
                        name: m.name || "Sans nom",
                        category: m.category || "Général",
                        startDate,
                        endDate,
                        progress: typeof m.progress === 'number' ? Math.min(1, Math.max(0, m.progress)) : 0,
                        isComplete: (m.progress || 0) >= 1,
                        sortOrder: i,
                        wbs: m.wbs || null,
                        wbsLevel: typeof m.wbsLevel === 'number' ? m.wbsLevel : 0,
                        isUserTrade: !!m.isUserTrade,
                        lot: m.lot || null,
                    }
                });
            }
            if (skipped > 0) {
                console.log(`Planning confirm: skipped ${skipped} milestones with invalid dates`);
            }
        });

        return NextResponse.json({ success: true, count: milestones.length });
    } catch (error) {
        console.error("Planning confirm error:", error);
        return NextResponse.json({ error: "Failed to save planning to database" }, { status: 500 });
    }
}
