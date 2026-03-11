import { NextResponse } from "next/server";
import { parseMetre } from "@/lib/metre-skill";
// No fs or path needed in production

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            );
        }

        // Read the file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // No debug saving in production to prevent read-only filesystem errors or container crashes

        // Parse using simplified Bordereau format
        const result = parseMetre(buffer);

        return NextResponse.json({ 
            success: true, 
            projectName: result.projectName,
            tasks: result.tasks,
            totalHours: result.totalHours,
            zones: result.zones,
        });

    } catch (error) {
        console.error("Upload error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
