import { NextResponse } from "next/server";

export async function GET() {
    // Dossier technique summaries are cached in localStorage on the frontend
    // after upload (returned in the upload POST response from /api/project/[id]/technique/upload).
    // This endpoint exists as a fallback but currently returns empty.
    // TODO: Store dossier data in DB during upload for server-side persistence.
    return NextResponse.json({ summaries: [] });
}
