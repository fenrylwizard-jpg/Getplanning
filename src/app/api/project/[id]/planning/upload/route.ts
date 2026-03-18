import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const trade = formData.get("trade") as string || "général";

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
                error: "La clé API Gemini (GEMINI_API_KEY) n'est pas configurée. Ajoutez-la dans Dokploy." 
            }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString("base64");
        console.log(`PDF received: ${file.name}, size: ${bytes.byteLength} bytes, trade: ${trade}`);

        try {
            console.log("Calling Gemini 3.1 Pro Preview...");
            
            const prompt = `Tu es un expert en gestion de chantiers de construction avec 20 ans d'expérience.

Ce document est un planning de chantier. Il peut prendre différentes formes :
- Diagramme de Gantt classique (MS Project, Primavera, etc.)
- Tableau de tâches avec colonnes (WBS, nom, durée, dates, etc.)
- Planning linéaire ou graphique
- Les colonnes peuvent avoir des noms variés : "Tâche", "Description", "Activity", "Task Name", "Nom de la tâche", "Désignation", etc.
- Les dates peuvent être au format français (JJ/MM/AA) ou international (YYYY-MM-DD)
- La durée peut être en jours ("jrs", "j", "days"), semaines ("sem", "weeks"), ou mois

L'utilisateur est un spécialiste en : ${trade.toUpperCase()}.
Marque les tâches qui concernent directement son corps de métier avec "isUserTrade": true.
Par exemple, si l'utilisateur est électricien, les tâches d'éclairage, câblage, tableaux électriques, courants forts/faibles doivent être marquées true.
Si l'utilisateur est chauffagiste/HVAC, les tâches de chauffage, ventilation, climatisation, gaines, radiateurs doivent être marquées true.
Si l'utilisateur est plombier, les tâches de plomberie, sanitaires, évacuation, alimentation eau doivent être marquées true.
Toutes les autres tâches doivent avoir "isUserTrade": false.

Extrais TOUTES les tâches et jalons visibles dans ce planning.

Pour CHAQUE tâche, fournis un objet JSON avec :
- "wbs": Le code WBS ou numéro de ligne si disponible (sinon "")
- "name": Le nom exact de la tâche tel qu'écrit dans le document
- "category": La catégorie logique basée sur le regroupement visuel ou la nature du travail. Catégories standards : "Installation Chantier", "Gros Œuvre", "Stabilité", "Enveloppe", "Second Œuvre - Électricité", "Second Œuvre - Plomberie", "Second Œuvre - HVAC", "Second Œuvre - Menuiserie", "Finitions", "Aménagements Extérieurs", "Réception", "Général"
- "duration": La durée telle qu'écrite (ex: "14 jrs", "20 jrs")
- "startDate": Date de début au format YYYY-MM-DD
- "endDate": Date de fin au format YYYY-MM-DD
- "progress": Pourcentage d'avancement entre 0 et 1 (si indiqué visuellement ou par %, sinon 0)
- "isUserTrade": true si cette tâche concerne directement le métier "${trade}" de l'utilisateur, false sinon

Réponds UNIQUEMENT avec le tableau JSON. Pas de markdown, pas de backticks, juste le JSON pur.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
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

            let jsonString = response.text || "[]";
            jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
            console.log(`Gemini response length: ${jsonString.length} chars`);

            let milestones = [];
            try {
                milestones = JSON.parse(jsonString);
            } catch {
                console.error("AI provided invalid JSON:", jsonString.substring(0, 300));
                return NextResponse.json({ error: "L'IA n'a pas retourné un JSON valide. Réessayez." }, { status: 500 });
            }

            console.log(`Successfully extracted ${milestones.length} milestones from ${file.name}`);

            return NextResponse.json({
                success: true,
                message: "Analyse Gemini réussie.",
                projectId: id,
                fileName: file.name,
                trade,
                count: milestones.length,
                data: milestones
            });

        } catch (aiError: unknown) {
            const errMsg = aiError instanceof Error ? aiError.message : String(aiError);
            console.error("Gemini AI API Error:", errMsg);
            return NextResponse.json({ 
                error: `Erreur Gemini API: ${errMsg}` 
            }, { status: 500 });
        }

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("Planning upload error:", errMsg);
        return NextResponse.json({ error: `Erreur upload: ${errMsg}` }, { status: 500 });
    }
}
