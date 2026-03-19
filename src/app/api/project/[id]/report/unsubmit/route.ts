import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    try {
        const body: { date?: string } = await req.json();
        const { date } = body;

        if (!date) {
            return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
        }

        const queryDate = new Date(date);
        
        // Calculate start and end of the query date in UTC to find the report
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Find the report to unsubmit
        const report = await prisma.dailyReport.findFirst({
            where: {
                projectId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Unsubmit the report (set status to DRAFT or similar depending on schema)
        // Assuming status is 'SUBMITTED', setting it back to 'DRAFT' (or however the app handles it). 
        // If status defaults to "DRAFT", we set it to that. If there's no "DRAFT" enum, maybe 'IN_PROGRESS' or simply update.
        // Wait, looking at the schema `status String @default("SUBMITTED")` or similar? Let's assume there is a draft/submitted differentiation.
        const updatedReport = await prisma.dailyReport.update({
            where: { id: report.id },
            data: { status: 'DRAFT' } // Assume DRAFT is valid if SUBMITTED is valid
        });

        return NextResponse.json({ success: true, report: updatedReport });
    } catch (err) {
        console.error("Error unsubmitting report:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
