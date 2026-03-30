import { NextResponse } from "next/server";
import { getJob } from "@/lib/planningJobStore";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
        return NextResponse.json({ error: "jobId requis" }, { status: 400 });
    }

    const job = getJob(jobId);
    if (!job) {
        return NextResponse.json({ error: "Job introuvable ou expiré" }, { status: 404 });
    }

    return NextResponse.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        ...(job.status === 'done' ? { result: job.result } : {}),
        ...(job.status === 'error' ? { error: job.error } : {}),
    });
}
