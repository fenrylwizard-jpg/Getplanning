import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

            // Insert new ones
            for (let i = 0; i < milestones.length; i++) {
                const m = milestones[i];
                await tx.planningMilestone.create({
                    data: {
                        projectId: id,
                        name: m.name,
                        category: m.category,
                        startDate: new Date(m.startDate),
                        endDate: new Date(m.endDate),
                        progress: m.progress,
                        isComplete: m.progress >= 1,
                        sortOrder: i
                    }
                });
            }
        });

        return NextResponse.json({ success: true, count: milestones.length });
    } catch (error) {
        console.error("Planning confirm error:", error);
        return NextResponse.json({ error: "Failed to save planning to database" }, { status: 500 });
    }
}
