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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set in environment variables!");
            return NextResponse.json({ 
                error: "La clé API Gemini (GEMINI_API_KEY) n'est pas configurée sur ce serveur. Ajoutez-la dans les variables d'environnement Dokploy." 
            }, { status: 500 });
        }

        // Initialize Gemini
        const ai = new GoogleGenAI({ apiKey });

        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString("base64");
        console.log(`PDF received: ${file.name}, size: ${bytes.byteLength} bytes`);

        try {
            console.log("Calling Gemini 3.1 Pro...");
            
            const prompt = `Tu es un expert en gestion de projet de construction. Ce document est un planning de projet (diagramme de Gantt).

Extrais TOUS les jalons et tâches visibles dans le tableau à gauche du planning.

Pour CHAQUE ligne du tableau, fournis:
- "wbs": Le code WBS (ex: "1.1.5", "1.4.3.2")
- "name": Le nom exact de la tâche tel qu'écrit dans le document
- "category": La catégorie principale basée sur le regroupement visuel (ex: "Gros Œuvre", "Second Œuvre", "Enveloppe", "Finitions", "Planning Amont", "Installation Chantier"). Si aucune catégorie n'est évidente, mets "Général".
- "duration": La durée en jours (ex: "779 jrs", "14 jrs")
- "startDate": La date de début au format YYYY-MM-DD
- "endDate": La date de fin au format YYYY-MM-DD
- "progress": Estimation du pourcentage d'avancement (entre 0 et 1). Si pas indiqué, mets 0.

Réponds UNIQUEMENT avec le tableau JSON. Pas de markdown, pas de backticks, juste le JSON pur.`;

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
            console.log(`Gemini response length: ${jsonString.length} chars`);

            let milestones = [];
            try {
                milestones = JSON.parse(jsonString);
            } catch {
                console.error("AI provided invalid JSON:", jsonString.substring(0, 200));
                return NextResponse.json({ error: "Impossible de déchiffrer la structure du planning. L'IA n'a pas retourné un JSON valide." }, { status: 500 });
            }

            console.log(`Successfully extracted ${milestones.length} milestones from ${file.name}`);

            return NextResponse.json({
                success: true,
                message: "Analyse Gemini réussie.",
                projectId: id,
                fileName: file.name,
                count: milestones.length,
                data: milestones
            });

        } catch (aiError: unknown) {
            const errMsg = aiError instanceof Error ? aiError.message : String(aiError);
            console.error("Gemini AI API Error:", errMsg);
            return NextResponse.json({ 
                error: `Erreur lors de l'analyse IA du calendrier: ${errMsg}` 
            }, { status: 500 });
        }

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("Planning upload error:", errMsg);
        return NextResponse.json({ error: `Erreur lors de l'envoi du fichier: ${errMsg}` }, { status: 500 });
    }
}
