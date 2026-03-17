import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "Le fichier doit être un PDF valide." }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "La clé API Gemini (GEMINI_API_KEY) n'est pas configurée sur ce serveur." }, { status: 500 });
        }

        // Initialize Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Save file locally to upload to Gemini
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Use a secure random name in the OS temp directory
        const tempFilePath = path.join(os.tmpdir(), `planning-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
        await writeFile(tempFilePath, buffer);

        try {
            console.log(`Uploading ${file.name} to Gemini...`);
            // Upload to Google File API
            const uploadResponse = await ai.files.upload({
                file: tempFilePath,
                mimeType: "application/pdf",
            } as any);
            console.log(`Upload complete. URI: ${uploadResponse.uri}`);

            // Prompt Gemini 2.5 Flash to extract the Gantt chart
            const prompt = `This is a construction project planning (Gantt chart).
Please extract all the major task milestones from this schedule.
Return ONLY a valid JSON array of objects without markdown blocks or backticks.

For each task, provide:
- "name": The name of the task
- "category": The main category it belongs to (e.g., Gros Œuvre, Second Œuvre, Finitions) based on visual grouping if any. If no category, just put "Général".
- "startDate": The estimated start date (format YYYY-MM-DD). Infer from the timeline markers.
- "endDate": The estimated end date (format YYYY-MM-DD). Infer from the timeline markers.
- "progress": Estimate completion percentage if marked (as a decimal between 0 and 1) otherwise 0.

Respond with ONLY the JSON array. Do not include markdown formatting like \`\`\`json.`;

            console.log("Analyzing with Gemini...");
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    uploadResponse,
                    { text: prompt }
                ],
                config: {
                    responseMimeType: "application/json"
                }
            });

            // Clean up the JSON if AI returns markdown despite prompt
            let jsonString = response.text || "[]";
            jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

            let milestones = [];
            try {
                milestones = JSON.parse(jsonString);
            } catch {
                console.error("AI provided invalid JSON:", jsonString);
                return NextResponse.json({ error: "Impossible de déchiffrer la structure du planning." }, { status: 500 });
            }

            console.log(`Extracted ${milestones.length} milestones successfully.`);

            // Cleanup local temp file
            await unlink(tempFilePath).catch(e => console.error("Error deleting temp file:", e));

            return NextResponse.json({
                success: true,
                message: "Analyse Gemini réussie.",
                projectId: id,
                fileName: file.name,
                count: milestones.length,
                data: milestones
            });

        } catch (aiError) {
            console.error("Gemini AI API Error:", aiError);
            // Cleanup local temp file even on error
            await unlink(tempFilePath).catch(e => console.error("Error deleting temp file:", e));
            return NextResponse.json({ error: "Erreur lors de l'analyse IA du calendrier." }, { status: 500 });
        }

    } catch (error) {
        console.error("Planning upload error:", error);
        return NextResponse.json({ error: "Erreur lors de l'envoi du fichier." }, { status: 500 });
    }
}
