import { NextResponse } from "next/server";

// Stub for planning file upload — will be implemented when user provides sample PDF
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

        // TODO: Parse PDF and extract milestones
        // For now, return a message that parsing will be available after sample file is provided
        return NextResponse.json({
            success: true,
            message: "File received. PDF parsing will be implemented with sample data.",
            projectId: id,
            fileName: file.name,
        });
    } catch (error) {
        console.error("Planning upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
