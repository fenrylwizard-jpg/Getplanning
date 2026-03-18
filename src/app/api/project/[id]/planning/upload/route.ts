import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { extractPlanningFromPDF, ExtractedTask, extractRawTextFromPDF } from "@/lib/pdfPlanningExtractor";

// Allow up to 5 minutes for large PDF processing + AI categorization
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Parse form data before streaming
    let file: File;
    let trade: string;
    try {
        const formData = await req.formData();
        file = formData.get("file") as File;
        trade = (formData.get("trade") as string) || "général";
        if (!file) {
            return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
        }
        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "Le fichier doit être un PDF valide." }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: "Erreur lecture du formulaire." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`PDF received: ${file.name}, size: ${bytes.byteLength} bytes, trade: ${trade}`);

    // Use a streaming response to keep the proxy connection alive
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => {
                controller.enqueue(encoder.encode(line + "\n"));
            };

            try {
                // ===== STEP 1: Deterministic extraction =====
                send("event:progress");
                send("data:Extraction du PDF...");
                console.log("Step 1: Extracting table data with pdf.js-extract...");

                let extractedTasks: ExtractedTask[];
                try {
                    extractedTasks = await extractPlanningFromPDF(buffer);
                    console.log(`Extracted ${extractedTasks.length} tasks deterministically`);
                } catch (extractError: unknown) {
                    const msg = extractError instanceof Error ? extractError.message : String(extractError);
                    console.error("PDF extraction failed:", msg);
                    send("event:error");
                    send(`data:${JSON.stringify({ error: `Erreur extraction: ${msg}` })}`);
                    controller.close();
                    return;
                }

                if (extractedTasks.length === 0) {
                    send("event:error");
                    send(`data:${JSON.stringify({ error: "Aucune tâche trouvée dans le PDF." })}`);
                    controller.close();
                    return;
                }

                send("event:progress");
                send(`data:${extractedTasks.length} tâches extraites, catégorisation IA...`);

                // ===== STEP 2: AI categorization =====
                const apiKey = process.env.GEMINI_API_KEY;
                let categorizedTasks;

                // Send keepalive pings every 10 seconds to prevent proxy timeout
                const keepalive = setInterval(() => {
                    send("event:ping");
                    send("data:keepalive");
                }, 10_000);

                try {
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
                } finally {
                    clearInterval(keepalive);
                }

                console.log(`Returning ${categorizedTasks.length} categorized milestones`);

                // Send the final result
                send("event:result");
                send(`data:${JSON.stringify({
                    success: true,
                    message: `${extractedTasks.length} tâches extraites, ${categorizedTasks.length} jalons catégorisés.`,
                    projectId: id,
                    fileName: file.name,
                    trade,
                    count: categorizedTasks.length,
                    data: categorizedTasks
                })}`);

            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : String(error);
                console.error("Planning upload error:", errMsg);
                send("event:error");
                send(`data:${JSON.stringify({ error: `Erreur upload: ${errMsg}` })}`);
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

/**
 * Use Gemini to intelligently categorize extracted tasks and tag user trade relevance.
 * This is much cheaper/faster than asking Gemini to parse the entire PDF.
 */
async function categorizeTasks(tasks: ExtractedTask[], trade: string, apiKey: string) {
    const ai = new GoogleGenAI({ apiKey });
    const BATCH_SIZE = 80;
    const TIMEOUT_MS = 180_000; // 3 minutes total

    // Split tasks into batches
    const batches: ExtractedTask[][] = [];
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        batches.push(tasks.slice(i, i + BATCH_SIZE));
    }
    console.log(`Splitting ${tasks.length} tasks into ${batches.length} batches of ~${BATCH_SIZE}`);

    // Process all batches in parallel with a global timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini API timeout after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
    );

    const batchPromises = batches.map(async (batch, batchIdx) => {
        const offset = batchIdx * BATCH_SIZE;
        // Compact input: just index|name|lot
        const lines = batch.map((t, i) =>
            `${offset + i}|${t.name}|${t.lot || ''}`
        ).join('\n');

        const prompt = `Catégorise ces tâches de chantier. Métier utilisateur: ${trade.toUpperCase()}.

${lines}

Réponds en JSON: tableau de [index,catégorie,isUserTrade]. Catégories: "Installation Chantier","Gros Œuvre","Enveloppe","HVAC","Plomberie","Électricité","Parachèvements","Finitions","Abords","Réception","Général","Congés". isUserTrade=true si la tâche concerne le métier ${trade}. JSON uniquement.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ text: prompt }],
                config: { responseMimeType: "application/json" }
            });

            let json = response.text || "[]";
            json = json.replace(/```json/g, "").replace(/```/g, "").trim();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed: any[] = JSON.parse(json);
            console.log(`Batch ${batchIdx + 1}/${batches.length}: ${parsed.length} tasks categorized`);
            return parsed;
        } catch (batchErr) {
            console.warn(`Batch ${batchIdx + 1} failed:`, batchErr instanceof Error ? batchErr.message : batchErr);
            // Return empty so other batches can still succeed
            return [] as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allCategories: any[];
    try {
        const results = await Promise.race([
            Promise.all(batchPromises),
            timeoutPromise
        ]);
        allCategories = results.flat();
        console.log(`AI categorization complete: ${allCategories.length}/${tasks.length} tasks categorized`);
    } catch (timeoutErr) {
        console.warn("Global timeout, using fallback:", timeoutErr instanceof Error ? timeoutErr.message : timeoutErr);
        return fallbackCategorize(tasks, trade);
    }

    // Build lookup from AI results — handle both tuple [i,cat,bool] and object {i,category,isUserTrade} formats
    const categoryMap = new Map<number, { category: string; isUserTrade: boolean }>();
    for (const item of allCategories) {
        if (Array.isArray(item)) {
            categoryMap.set(item[0], { category: item[1], isUserTrade: !!item[2] });
        } else if (item && typeof item === 'object') {
            const obj = item as unknown as Record<string, unknown>;
            const idx = (obj.i ?? obj.index ?? obj.idx) as number;
            const cat = (obj.category ?? obj.cat ?? 'Général') as string;
            const trade = !!(obj.isUserTrade ?? obj.isTrade ?? false);
            if (typeof idx === 'number') categoryMap.set(idx, { category: cat, isUserTrade: trade });
        }
    }

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
