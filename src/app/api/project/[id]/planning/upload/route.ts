import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { extractPlanningFromPDF, ExtractedTask, extractRawTextFromPDF } from "@/lib/pdfPlanningExtractor";

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

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        console.log(`PDF received: ${file.name}, size: ${bytes.byteLength} bytes, trade: ${trade}`);

        // ===== STEP 1: Deterministic extraction with pdf.js-extract =====
        console.log("Step 1: Extracting table data with pdf.js-extract...");
        let extractedTasks: ExtractedTask[];
        try {
            extractedTasks = await extractPlanningFromPDF(buffer);
            console.log(`Extracted ${extractedTasks.length} tasks deterministically`);
        } catch (extractError: unknown) {
            const msg = extractError instanceof Error ? extractError.message : String(extractError);
            console.error("PDF extraction failed:", msg);
            return NextResponse.json({ 
                error: `Erreur lors de l'extraction du PDF: ${msg}` 
            }, { status: 500 });
        }

        if (extractedTasks.length === 0) {
            const rawDump = await extractRawTextFromPDF(buffer);
            const crashBanner = `Aucune tâche trouvée.\n\n---- DUMP RAW TEXT POUR LE DEV (Veuillez faire une capture) ----\n${rawDump.join('\n')}`;
            return NextResponse.json({ error: crashBanner }, { status: 400 });
        }

        // ===== STEP 2: AI categorization with Gemini (trade awareness) =====
        const apiKey = process.env.GEMINI_API_KEY;
        let categorizedTasks;

        if (apiKey) {
            console.log("Step 2: Categorizing tasks with Gemini AI...");
            try {
                categorizedTasks = await categorizeTasks(extractedTasks, trade, apiKey);
                console.log("AI categorization complete");
            } catch (aiError: unknown) {
                const msg = aiError instanceof Error ? aiError.message : String(aiError);
                console.warn("AI categorization failed, using fallback:", msg);
                categorizedTasks = fallbackCategorize(extractedTasks, trade);
            }
        } else {
            console.log("Step 2: No API key, using rule-based categorization");
            categorizedTasks = fallbackCategorize(extractedTasks, trade);
        }

        console.log(`Returning ${categorizedTasks.length} categorized milestones`);

        return NextResponse.json({
            success: true,
            message: `${extractedTasks.length} tâches extraites du PDF, ${categorizedTasks.length} jalons catégorisés.`,
            projectId: id,
            fileName: file.name,
            trade,
            count: categorizedTasks.length,
            data: categorizedTasks
        });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("Planning upload error:", errMsg);
        return NextResponse.json({ error: `Erreur upload: ${errMsg}` }, { status: 500 });
    }
}

/**
 * Use Gemini to intelligently categorize extracted tasks and tag user trade relevance.
 * This is much cheaper/faster than asking Gemini to parse the entire PDF.
 */
async function categorizeTasks(tasks: ExtractedTask[], trade: string, apiKey: string) {
    const ai = new GoogleGenAI({ apiKey });

    // Send a compact summary to Gemini — just the task list, not the whole PDF
    const taskSummary = tasks.map((t, i) => 
        `${i}|${t.wbs}|${t.name}|${t.duration}|${t.startDate}|${t.endDate}|${t.lot || ''}`
    ).join('\n');

    const prompt = `Tu es un expert en gestion de chantiers de construction.
Voici une liste de tâches extraites d'un planning de chantier. Format: index|WBS|Tâche|Durée|Début|Fin|Lot

${taskSummary}

L'utilisateur est spécialiste en: ${trade.toUpperCase()}.

Pour CHAQUE tâche (par index), retourne un objet JSON avec:
- "i": l'index de la tâche
- "category": la catégorie logique parmi: "Installation Chantier", "Gros Œuvre", "Stabilité", "Enveloppe", "Second Œuvre", "Techniques Spéciales", "HVAC", "Plomberie", "Électricité", "Ascenseurs", "Parachèvements", "Finitions", "Abords", "Réception", "Général", "Congés"
- "isUserTrade": true si cette tâche concerne directement le métier "${trade}", false sinon

Réponds UNIQUEMENT avec le tableau JSON. Pas de markdown, pas de backticks.`;

    // Timeout wrapper: abort if Gemini doesn't respond in 30 seconds
    const TIMEOUT_MS = 30_000;
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Gemini API timeout after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
    );

    const response = await Promise.race([
        ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ text: prompt }],
            config: { responseMimeType: "application/json" }
        }),
        timeoutPromise
    ]);

    let jsonString = response.text || "[]";
    jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let categories: Array<{ i: number; category: string; isUserTrade: boolean }>;
    try {
        categories = JSON.parse(jsonString);
    } catch {
        console.warn("AI returned invalid JSON, using fallback categorization");
        return fallbackCategorize(tasks, trade);
    }

    // Merge AI categories with extracted data
    const categoryMap = new Map(categories.map(c => [c.i, c]));
    
    return tasks.map((task, idx) => {
        const cat = categoryMap.get(idx);
        return {
            wbs: task.wbs,
            name: task.name,
            category: cat?.category || guessCategory(task),
            startDate: task.startDate,
            endDate: task.endDate,
            duration: task.duration,
            progress: 0,
            isUserTrade: cat?.isUserTrade || false,
            zone: task.zone,
            lot: task.lot,
            margin: task.margin,
        };
    });
}

/**
 * Rule-based fallback categorization when Gemini is unavailable.
 * Uses keyword matching on task names and WBS codes.
 */
function fallbackCategorize(tasks: ExtractedTask[], trade: string) {
    return tasks.map(task => ({
        wbs: task.wbs,
        name: task.name,
        category: guessCategory(task),
        startDate: task.startDate,
        endDate: task.endDate,
        duration: task.duration,
        progress: 0,
        isUserTrade: isTradeRelated(task, trade),
        zone: task.zone,
        lot: task.lot,
        margin: task.margin,
    }));
}

function guessCategory(task: ExtractedTask): string {
    const name = (task.name || '').toLowerCase();
    const lot = (task.lot || '').toLowerCase();
    
    if (name.includes('congé') || name.includes('vacance') || name.includes('rentrée')) return 'Congés';
    if (name.includes('installation chantier') || name.includes('inst.chant')) return 'Installation Chantier';
    if (name.includes('stabilit') || name.includes('gros oeuvre') || name.includes('fondation')) return 'Gros Œuvre';
    if (name.includes('enveloppe') || name.includes('façade') || name.includes('toiture') || name.includes('étanchéit')) return 'Enveloppe';
    if (name.includes('hvac') || name.includes('chauff') || name.includes('ventilation') || name.includes('radiateur') || lot.includes('hvac')) return 'HVAC';
    if (name.includes('sanitaire') || name.includes('plomberie') || name.includes('égouttage') || name.includes('bain') || name.includes('tub') || lot.includes('sanit')) return 'Plomberie';
    if (name.includes('electric') || name.includes('câbl') || name.includes('luminaire') || name.includes('prise') || name.includes('tableau') || lot.includes('electr')) return 'Électricité';
    if (name.includes('ascenseur')) return 'Ascenseurs';
    if (name.includes('parachèv') || name.includes('cloison') || name.includes('chape') || name.includes('enduit') || name.includes('carrelage') || name.includes('plafond')) return 'Parachèvements';
    if (name.includes('peinture') || name.includes('finition') || name.includes('ferronnerie') || name.includes('menuiserie')) return 'Finitions';
    if (name.includes('abord') || name.includes('parking') || name.includes('clôture') || name.includes('horticole')) return 'Abords';
    if (name.includes('réception') || name.includes('nettoyage') || name.includes('préréception') || name.includes('correction')) return 'Réception';
    if (name.includes('mise en service') || name.includes('réglage')) return 'Mise en service';
    
    return 'Général';
}

function isTradeRelated(task: ExtractedTask, trade: string): boolean {
    const name = (task.name || '').toLowerCase();
    const lot = (task.lot || '').toLowerCase();
    const t = trade.toLowerCase();
    
    if (t.includes('electr')) {
        return name.includes('electric') || name.includes('câbl') || name.includes('luminaire') || 
               name.includes('prise') || name.includes('interrupteur') || name.includes('tableau') ||
               name.includes('détect') || name.includes('petit materiel') || lot.includes('electr');
    }
    if (t.includes('chauff') || t.includes('hvac')) {
        return name.includes('hvac') || name.includes('chauff') || name.includes('ventilation') || 
               name.includes('radiateur') || name.includes('grille') || name.includes('hotte') ||
               name.includes('gtc') || name.includes('gaz') || lot.includes('hvac');
    }
    if (t.includes('plomb')) {
        return name.includes('sanitaire') || name.includes('plomberie') || name.includes('égouttage') || 
               name.includes('bain') || name.includes('tub') || name.includes('caniveau') || lot.includes('sanit');
    }
    if (t.includes('gainist')) {
        return name.includes('gaine') || name.includes('ventilation') || name.includes('conduit');
    }
    if (t.includes('menuisi')) {
        return name.includes('menuiser') || name.includes('lambris') || name.includes('mobilier') || 
               name.includes('logette') || lot.includes('menuis');
    }
    if (t.includes('peintr')) {
        return name.includes('peinture') || name.includes('enduit') || lot.includes('peinture');
    }
    if (t.includes('carrel')) {
        return name.includes('carrelage') || name.includes('plinthe') || lot.includes('carrelage');
    }
    
    return false; // "general" trade → nothing highlighted
}
