import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Clé API Gemini non configurée. Contactez l\'administrateur.' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const body = await req.json();
        const {
            protocols = [],   // string[] - 'low-fodmap' | 'perte-de-poids' | 'sans-gluten' etc.
            protocolPhase,    // 1 | 2 | 3 (usually for low-fodmap)
            pantryItems = [], // string[] - items user has
            usePantryOnly,    // boolean - use only pantry items?
            mealPrepMode,     // boolean - optimize for batch cooking?
            servings = 2,     // number
            mealType,         // 'petit-déj' | 'déjeuner' | 'dîner' | 'collation'
            preferences,      // string - free text (optional)
        } = body;

        const pantryList = pantryItems.join(', ');
        const protocolsList = protocols.length > 0 ? protocols.join(', ') : 'Aucun régime spécifique';
        
        let protocolInstructions = `RÉGIMES ET PROTOCOLES: ${protocolsList}`;
        if (protocols.includes('low-fodmap')) {
            protocolInstructions += `\n- Spécificité Low-FODMAP (Phase ${protocolPhase}): ${
                protocolPhase === 1 
                    ? `Phase d'élimination stricte. INTERDITS ABSOLUS: ail, oignon (y compris en poudre), échalote, poireau, blé (pain, pâtes, couscous, farine de blé), seigle, orge, lait de vache, crème fraîche, yaourt classique, ricotta, mascarpone, pommes, poires, mangue, cerises, pastèque, dattes, figues, miel, sirop d'agave, champignons, avocat, haricots, lentilles, pois chiches, fèves, artichauts, asperges, chou-fleur, betterave. AUTORISÉS: riz, quinoa, pommes de terre, carottes, courgettes, poivrons, tomates (petites quantités), épinards, brocoli, concombre, aubergine, poisson, poulet, boeuf, tofu ferme, fromages à pâte dure (parmesan, comté), beurre, lait sans lactose, fraises, myrtilles, framboises, kiwi, citron, oranges, banane (pas trop mûre), érable, sucre, huile d'olive. Set fodmapSafe=true UNIQUEMENT si la recette ne contient AUCUN ingrédient interdit.`
                    : protocolPhase === 2
                    ? 'Phase de réintroduction. Les recettes peuvent inclure UN groupe FODMAP à tester à la fois. Set fodmapSafe en conséquence.'
                    : 'Phase de personnalisation. Régime principalement Low-FODMAP avec quelques flexibilités. Set fodmapSafe=true si aucun ingrédient fortement FODMAP.'
            }`;
        }
        if (protocols.includes('perte-de-poids')) {
            protocolInstructions += `\n- Spécificité Perte de poids: Privilégier les aliments rassasiants, riches en fibres et en protéines, modérés en matières grasses et en sucres ajoutés. Garder les calories raisonnables par portion.`;
        }

        const prompt = `Tu es un chef cuisinier expert et diététicien spécialisé dans les régimes alimentaires. Génère 5 recettes en français qui respectent TOUS les critères suivants:

${protocolInstructions}

${usePantryOnly && pantryList
    ? `INGRÉDIENTS DISPONIBLES: ${pantryList}. Utilise UNIQUEMENT ces ingrédients (+ épices et condiments de base).`
    : pantryList
    ? `INGRÉDIENTS EN STOCK: ${pantryList}. Privilégie ces ingrédients mais d'autres sont acceptés.`
    : ''
}

TYPE DE REPAS: ${mealType || 'tous types'}
NOMBRE DE PORTIONS: ${servings}
${mealPrepMode ? 'MODE MEAL PREP: Oui — les recettes doivent se conserver facilement 3-5 jours au frigo, être faciles à réchauffer, et idéales pour la préparation en batch.' : ''}
${preferences ? `PRÉFÉRENCES SUPPLÉMENTAIRES: ${preferences}` : ''}

IMPORTANT: Tu dois OBLIGATOIREMENT estimer les calories (kcal) par portion.
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks. Utilise ce format:
[
  {
    "name": "Nom de la recette",
    "emoji": "emoji représentatif",
    "time": "temps de préparation",
    "difficulty": "Facile/Moyen/Difficile",
    "servings": nombre,
    "kcalPerServing": nombre_entier,
    "tags": ["tag1", "tag2"],
    "ingredients": ["ingrédient 1 (quantité)", "ingrédient 2 (quantité)"],
    "steps": ["Étape 1", "Étape 2"],
    "tips": "Conseil de conservation ou variante",
    "fodmapSafe": true/false
  }
]`;


        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text || '';

        // Try to parse the JSON response
        let recipes;
        try {
            // Clean up potential markdown wrapping
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            recipes = JSON.parse(cleaned);
        } catch {
            // If parsing fails, return the raw text
            return NextResponse.json({ recipes: [], rawText: text, error: 'Failed to parse recipes' });
        }

        return NextResponse.json({ recipes }, { headers: corsHeaders });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Gemini API error:', errorMsg);
        return NextResponse.json(
            { error: `Erreur Gemini: ${errorMsg}` },
            { status: 500, headers: corsHeaders }
        );
    }
}
