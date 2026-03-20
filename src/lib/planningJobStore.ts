/**
 * In-memory job store for planning PDF processing.
 * Jobs are stored in a Map and auto-expire after 30 minutes.
 */

export interface PlanningJob {
    id: string;
    projectId: string;
    status: 'processing' | 'done' | 'error';
    progress: string;
    result?: unknown;
    error?: string;
    createdAt: number;
}

const jobs = new Map<string, PlanningJob>();

// Auto-cleanup: remove jobs older than 30 minutes
const EXPIRY_MS = 30 * 60 * 1000;

function cleanup() {
    const now = Date.now();
    for (const [id, job] of jobs) {
        if (now - job.createdAt > EXPIRY_MS) {
            jobs.delete(id);
        }
    }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanup, 5 * 60 * 1000);
}

export function createJob(projectId: string): PlanningJob {
    cleanup();
    const id = `pj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: PlanningJob = {
        id,
        projectId,
        status: 'processing',
        progress: 'Démarrage...',
        createdAt: Date.now(),
    };
    jobs.set(id, job);
    return job;
}

export function updateJob(id: string, update: Partial<PlanningJob>) {
    const job = jobs.get(id);
    if (job) {
        Object.assign(job, update);
    }
}

export function getJob(id: string): PlanningJob | undefined {
    return jobs.get(id);
}
