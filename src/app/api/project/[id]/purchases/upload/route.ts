import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

        // TODO: Parse Excel and extract purchases
        return NextResponse.json({
            success: true,
            message: "File received. Excel parsing will be implemented with sample data.",
            projectId: id,
            fileName: file.name,
        });
    } catch (error) {
        console.error("Purchases upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
