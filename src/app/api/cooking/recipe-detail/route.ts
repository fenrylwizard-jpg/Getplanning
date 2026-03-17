import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Clé API Gemini non configurée.' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const body = await req.json();
        const { recipeName, recipeCategory, recipeKcal, recipeTags = [], recipeDifficulty, recipeTime } = body;

        if (!recipeName) {
            return NextResponse.json({ error: 'Nom de recette manquant.' }, { status: 400 });
        }

        const prompt = `Tu es un chef cuisinier expert. Génère les détails complets pour cette recette française:

NOM: ${recipeName}
CATÉGORIE: ${recipeCategory || 'Plat'}
CALORIES PAR PORTION: ${recipeKcal || '~400'} kcal
DIFFICULTÉ: ${recipeDifficulty || 'Moyen'}
TEMPS: ${recipeTime || '30 min'}
TAGS: ${recipeTags.join(', ') || 'Aucun'}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks. Utilise ce format:
{
  "ingredients": ["ingrédient 1 (quantité)", "ingrédient 2 (quantité)"],
  "steps": ["Étape courte et claire 1", "Étape courte et claire 2"],
  "tips": "Un conseil utile sur la recette (conservation, variante, astuce de chef)"
}

RÈGLES:
- Les ingrédients doivent être réalistes et cohérents avec le nom et la catégorie
- Les étapes doivent être concises (1-2 phrases max par étape), entre 4 et 7 étapes
- Les ingrédients doivent correspondre aux calories indiquées
- Le tip doit être pratique et utile
- Garde un ton convivial et professionnel`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text || '';

        let detail;
        try {
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            detail = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({ error: 'Impossible de parser la réponse IA.' }, { status: 500 });
        }

        return NextResponse.json(detail);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Gemini recipe-detail error:', errorMsg);
        return NextResponse.json(
            { error: `Erreur Gemini: ${errorMsg}` },
            { status: 500 }
        );
    }
}
