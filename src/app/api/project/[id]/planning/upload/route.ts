import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString("base64");

        try {
            console.log(`Analyzing ${file.name} with Gemini 3.1 Pro...`);
            
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

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro',
                contents: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "application/pdf"
                        }
                    },
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
            return NextResponse.json({ error: "Erreur lors de l'analyse IA du calendrier." }, { status: 500 });
        }

    } catch (error) {
        console.error("Planning upload error:", error);
        return NextResponse.json({ error: "Erreur lors de l'envoi du fichier." }, { status: 500 });
    }
}
