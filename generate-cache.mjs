import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the static recipes from recipesData.ts
// Quick regex to extract the JSON array
const dataFilePath = path.join(__dirname, 'src', 'app', 'cooking', 'data', 'recipesData.ts');
const fileData = fs.readFileSync(dataFilePath, 'utf8');

// Find the array part
const match = fileData.match(/export const staticRecipes: StaticRecipe\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error("Could not find staticRecipes array");
    process.exit(1);
}

const recipes = JSON.parse(match[1]);
console.log(`Loaded ${recipes.length} recipes.`);

const outPath = path.join(__dirname, 'src', 'app', 'cooking', 'data', 'recipeDetails.json');
let detailsCache = {};
if (fs.existsSync(outPath)) {
    detailsCache = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    console.log(`Loaded ${Object.keys(detailsCache).length} already cached details.`);
}

async function fetchDetails(recipe) {
    const res = await fetch('https://getplanning.org/api/cooking/recipe-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipeName: recipe.name,
            recipeCategory: recipe.category,
            recipeKcal: recipe.kcal,
            recipeTags: recipe.tags,
            recipeDifficulty: recipe.difficulty,
            recipeTime: recipe.time,
        })
    });
    
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    return data;
}

// We will fetch in batches to avoid overwhelming the API
// Rate limit might be 15RPM (4s delay) or higher. Let's try 5 concurrent, with 500ms delay between batches.
// If it fails with 429, we increase delay.
const batchSize = 5;
let rateLimitDelay = 1000;

async function run() {
    let successCount = 0;
    
    // Determine which recipes still need details
    const remaining = recipes.filter(r => !detailsCache[r.id]);
    console.log(`Need to fetch ${remaining.length} recipes.`);
    
    for (let i = 0; i < remaining.length; i += batchSize) {
        const batch = remaining.slice(i, i + batchSize);
        console.log(`Process batch ${i/batchSize} of ${Math.ceil(remaining.length/batchSize)}...`);
        
        try {
            const results = await Promise.all(batch.map(async (r) => {
                const det = await fetchDetails(r);
                return { id: r.id, detail: det };
            }));
            
            for (const res of results) {
                detailsCache[res.id] = res.detail;
            }
            
            successCount += results.length;
            
            // Save periodically
            if (successCount % 20 === 0) {
                fs.writeFileSync(outPath, JSON.stringify(detailsCache, null, 2));
            }
            
            // Delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        } catch (e) {
            console.error(`Error in batch starting at ${i}:`, e.message);
            // If error is 429 Too Many Requests, slow down significantly
            if (e.message.includes('429')) {
                console.log("Rate limited! Waiting 30 seconds and slowing down...");
                rateLimitDelay = 4000;
                await new Promise(resolve => setTimeout(resolve, 30000));
                i -= batchSize; // Retry this batch
            } else {
                console.log("Waiting 10 seconds before retrying...");
                await new Promise(resolve => setTimeout(resolve, 10000));
                i -= batchSize;
            }
        }
    }
    
    fs.writeFileSync(outPath, JSON.stringify(detailsCache, null, 2));
    console.log('Finished pre-generating recipes!');
}

run();
