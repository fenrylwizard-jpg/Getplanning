const fs = require('fs');
const path = require('path');

const categories = [
  'Petit-déj', 'Entrée', 'Plat', 'Accompagnement', 'Dessert', 'Boisson', 'Collation', 'Sauce'
];

const emojis = {
  'Petit-déj': ['🥞', '🍳', '🥣', '🫐', '🥝', '🥑', '🍞', '🥥', '🧇', '🍓', '🥜'],
  'Entrée': ['🥗', '🥕', '🍅', '🍜', '🫘', '🥒', '🥥', '🌾', '🍉', '🦐', '🥦', '🧅'],
  'Plat': ['🍚', '🐟', '🍗', '🍝', '🍛', '🍆', '🥩', '🌶️', '🍔', '🌮', '🥘', '🍱', '🥟', '🥦', '🫑', '🦆'],
  'Accompagnement': ['🍠', '🍚', '🥕', '🥒', '🫛', '🥔', '🥬', '🌿', '🥦', '🥗'],
  'Dessert': ['🍮', '🍫', '🍎', '🍓', '🍋', '☕', '🍪', '🍒', '🍌', '🍰', '🥭', '🧁', '🍡', '🥧'],
  'Boisson': ['🍓', '🥬', '🍵', '☕', '🍋', '🍹', '🥛', '💪', '🍑'],
  'Collation': ['🍫', '🥕', '🧁', '🥬', '🍯', '🫛', '🥑', '🍿', '🌾', '🌴'],
  'Sauce': ['🍅', '🫒', '🌿', '🥛', '🍲', '🍛', '🧄', '🍋', '🍓']
};

const bases = {
  'Petit-déj': ['Porridge', 'Pancakes', 'Smoothie', 'Tartine', 'Omelette', 'Bol açaí', 'Granola', 'Yaourt grec', 'Muffins', 'Pain perdu', 'Gaufres'],
  'Entrée': ['Salade', 'Velouté', 'Bruschetta', 'Soupe', 'Houmous', 'Carpaccio', 'Gaspacho', 'Tartare', 'Ceviche', 'Rouleaux de printemps', 'Accras'],
  'Plat': ['Risotto', 'Saumon grillé', 'Poulet rôti', 'Bowl', 'Pâtes', 'Curry', 'Steak', 'Ratatouille', 'Pad thaï', 'Gratin', 'Tajine', 'Lasagnes', 'Sushi', 'Chili', 'Wok', 'Quiche', 'Burger', 'Couscous', 'Tacos', 'Paëlla', 'Pizza'],
  'Accompagnement': ['Purée', 'Riz', 'Légumes rôtis', 'Frites', 'Poêlée', 'Tabboulé', 'Brocolis vapeur', 'Salade'],
  'Dessert': ['Crème brûlée', 'Fondant', 'Tarte', 'Panna cotta', 'Mousse', 'Sorbet', 'Tiramisu', 'Cookies', 'Clafoutis', 'Cake', 'Cheesecake', 'Macarons', 'Brownies'],
  'Boisson': ['Smoothie', 'Jus vert', 'Latte', 'Chocolat chaud', 'Infusion', 'Limonade', 'Thé glacé', 'Café frappé'],
  'Collation': ['Barres de céréales', 'Bâtonnets de légumes', 'Muffins', 'Chips', 'Toast', 'Guacamole', 'Popcorn', 'Crackers'],
  'Sauce': ['Sauce tomate', 'Vinaigrette', 'Pesto', 'Sauce béchamel', 'Bouillon', 'Ayoli', 'Mayonnaise', 'Confiture']
};

const flavors = {
  'Petit-déj': ['aux myrtilles', 'aux herbes', 'à la banane', 'épinards-kiwi', 'avocat-œuf', 'maison', 'fruits rouges', 'aux carottes', 'à la cannelle', 'coco-mangue', 'au cacao', 'saumon fumé', 'beurre de cacahuète', 'tropical'],
  'Entrée': ['César', 'au gingembre', 'tomates-basilic', 'miso', 'aux courgettes', 'au lait de coco', 'de quinoa', 'andalou', 'niçoise', 'de potimarron', 'de saumon', 'de lentilles', 'de daurade', 'à l\'oignon', 'feta-pastèque', 'crevettes', 'de brocolis', 'aux noix', 'de morue'],
  'Plat': ['aux courgettes', 'aux herbes', 'au tofu', 'carbonara', 'de pois chiches', 'mi-cuit', 'provençale', 'au poulet', 'dauphinois', 'citron confit', 'végétarien', 'saumon-avocat', 'sin carne', 'en croûte', 'au sésame', 'lorraine', 'coréen', 'de veau', 'quinoa-légumes', 'maison', 'royal', 'à l\'ail', 'tikka masala', 'béchamel', 'bourguignon', 'sauce tahini', 'margherita', 'au gingembre', 'grecque', 'au poisson marin', 'valenciana', 'teriyaki', 'basquaise', 'de lentilles corail', 'en papillote', 'ricotta-épinards', 'goreng', 'd\'été', 'laqué', 'aux champignons', 'sauce tomate', 'au citron et romarin', 'au bœuf', 'vietnamienne', 'panées', 'poulet-avocat', 'milanais', 'méditerranéenne', 'au curry vert', 'au riz', 'au miel', 'hawaïen'],
  'Accompagnement': ['de patates douces', 'aux herbes', 'au four', 'à l\'aneth', 'sautés', 'de pommes de terre', 'de chou rouge', 'de patate douce', 'au thym', 'libanais', 'au miel', 'd\'épinards-grenade', 'au citron', 'maison'],
  'Dessert': ['vanille', 'au chocolat', 'aux pommes', 'fruits rouges', 'maison', 'classique', 'aux pépites de chocolat', 'aux cerises', 'coco-dattes', 'new-yorkais', 'exotiques', 'au citron', 'à la vanille', 'framboise', 'meringuée', 'fondants', 'pomme-cannelle', 'fraises-rhubarbe', 'pâtissier', 'glacé', 'tatin'],
  'Boisson': ['fraises-banane', 'détox', 'matcha', 'onctueux', 'gingembre-citron', 'à la menthe', '(lait d\'or)', 'post-sport', 'pêche maison', 'grec'],
  'Collation': ['maison', '& houmous', 'banane-noix', 'de kale', 'ricotta-miel', 'au sel de mer', 'au parmesan', 'aux graines', 'de dattes fourrées'],
  'Sauce': ['maison', 'balsamique', 'basilic frais', 'légère', 'chimichurri', 'de légumes', 'curry thaï', 'provençal', 'ponzu', 'de fraises']
};

const difficulties = ['Facile', 'Moyen', 'Difficile'];
const allTags = ['Sans gluten', 'Low-FODMAP', 'Rapide', 'Protéiné', 'Keto', 'Sucré', 'Végétarien', 'Vegan', 'Détox', 'Tendance', 'Meal Prep', 'Classique', 'Superaliment', 'Méditerranéen', 'Oméga-3', 'Sport', 'Breton', 'Italien', 'Japonais', 'Cru', 'Asiatique', 'Épicé', 'Espagnol', 'Froid', 'Automnal', 'Frais', 'Péruvien', 'Français', 'Estival', 'Léger', 'Hivernal', 'Antillais', 'Frit', 'Indien', 'Thaï', 'Populaire', 'Réconfort', 'Marocain', 'Mexicain', 'Gastronomique', 'Fête', 'Coréen', 'Complet', 'Maghrébin', 'Fruits de mer', 'Mijotage', 'Libanais', 'Grec', 'Fait maison', 'Indonésien', 'Chinois', 'Enfants', 'Bouillon', 'Wok', 'Cru', 'Sucré-salé', 'Grillé', 'Ayurvédique', 'Gourmand', 'Acidulé', 'Bébé', 'Croquant', 'Boulangerie', 'Glacé', 'Caramélisé'];
const times = ['5 min', '8 min', '10 min', '12 min', '15 min', '20 min', '25 min', '30 min', '35 min', '40 min', '45 min', '50 min', '60 min', '90 min', '120 min'];

// ═══════════════════════════════════════════════════════════
// FODMAP VERIFICATION SYSTEM
// Based on Monash University FODMAP guidelines
// ═══════════════════════════════════════════════════════════

// HIGH-FODMAP keywords: if a recipe name/base/flavor contains any of these,
// it is NOT FODMAP-safe (Phase 1 Elimination)
const HIGH_FODMAP_KEYWORDS = [
  // Fructans (Oligosaccharides)
  'ail', 'oignon', 'blé', 'seigle', 'couscous', 'pain', 'pâtes', 'lasagne',
  'pizza', 'croûte', 'panée', 'panées', 'pain perdu', 'béchamel', 'gaufre',
  'burger', 'crêpe', 'brioche', 'boulangerie', 'farine', 'semoule',
  'artichaut', 'asperge', 'betterave', 'chou-fleur', 'poireau',
  'chicorée', 'salsifis', 'topinambour', 'pissenlit',
  
  // GOS (Galacto-oligosaccharides)
  'pois chiche', 'haricot', 'lentille', 'fève', 'lentilles',
  'houmous', 'hummus', 'chili', 'dal', 'edamame',
  
  // Lactose (Disaccharides)
  'lait', 'crème', 'yaourt', 'ricotta', 'mascarpone',
  'béchamel', 'crème brûlée', 'panna cotta', 'tiramisu',
  'cheesecake', 'chocolat chaud', 'latte', 'cappuccino',
  'crème glacée', 'glace', 'ice cream',
  
  // Fructose (Monosaccharides) — in excess of glucose
  'miel', 'pomme', 'poire', 'mangue', 'cerise',
  'pastèque', 'figue', 'datte', 'agave',
  'confiture', 'compote', 'jus de pomme',
  
  // Polyols
  'champignon', 'avocat', 'abricot', 'prune', 'nectarine',
  'pêche', 'chou-fleur', 'sorbitol', 'mannitol', 'xylitol',
  
  // Common high-FODMAP dish types
  'bolognaise', 'bolognese', 'carbonara', 'bourguignon',
  'ragu', 'ragout', 'guacamole', 'fondue',
  'dauphinois', 'gratin', 'quiche', 'lorraine',
  'tajine', 'paëlla', 'pad thaï',
  'curry', 'tikka', 'masala', 'vindaloo',
  'miso', 'kimchi',
];

// BASES that are inherently high-FODMAP (wheat-based or contain high-FODMAP ingredients)
const HIGH_FODMAP_BASES = [
  'Pâtes', 'Lasagnes', 'Pizza', 'Couscous', 'Burger', 'Quiche', 'Pain perdu',
  'Gaufres', 'Pancakes', 'Muffins', 'Cookies', 'Brownies', 'Cake', 'Clafoutis',
  'Crème brûlée', 'Panna cotta', 'Tiramisu', 'Cheesecake', 'Macarons',
  'Fondant', 'Tarte',  // Usually wheat-based
  'Houmous',  // Chickpeas = high GOS
  'Chili',  // Usually contains beans
  'Pad thaï',  // Usually contains garlic/onion
  'Tajine',  // Onion-based
  'Barres de céréales',  // Wheat/honey
  'Sauce béchamel',  // Wheat flour + milk
  'Chocolat chaud',  // Milk-based
  'Latte',  // Milk-based
  'Granola',  // Often honey + wheat
  'Confiture',  // High fructose
  'Guacamole',  // Avocado = polyols
];

// FLAVORS that indicate high-FODMAP content
const HIGH_FODMAP_FLAVORS = [
  'à l\'ail', 'à l\'oignon', 'carbonara', 'béchamel',
  'bolognaise', 'bourguignon', 'de pois chiches',
  'de lentilles', 'de lentilles corail',
  'aux champignons', 'au miel', 'coco-dattes',
  'ricotta-épinards', 'ricotta-miel',
  'aux pommes', 'pomme-cannelle', 'aux cerises',
  'aux poires', 'coco-mangue', 'mangue',
  'dauphinois', 'lorraine', 'tikka masala',
  'sin carne',  // Usually bean-based
  '& houmous', 'de dattes fourrées',
  'pêche maison', 'onctueux',  // Usually milk-based
  'à la banane',  // Bananas are moderate, but ripe ones are high-FODMAP
  'fraises-rhubarbe',  // Rhubarb is uncertain
  'tatin',  // Apples
];

// SAFE bases: known low-FODMAP foundations
const SAFE_FODMAP_BASES = [
  'Riz', 'Saumon grillé', 'Poulet rôti', 'Bowl', 'Steak',
  'Ratatouille', 'Sushi', 'Wok', 'Tacos', // corn-based
  'Ceviche', 'Carpaccio', 'Tartare',
  'Brocolis vapeur', 'Frites', // potato-based
  'Sorbet', // fruit-based, check flavor
  'Purée', // potato-based
  'Vinaigrette', 'Pesto', // can be FODMAP-safe
  'Mayonnaise',
  'Infusion', 'Thé glacé', 'Café frappé', 'Limonade',
  'Popcorn', 'Chips',
];

function isFodmapSafe(name, base, flavor, category, tags) {
  const nameLower = name.toLowerCase();
  const baseLower = base.toLowerCase();
  const flavorLower = flavor.toLowerCase();
  const fullText = `${nameLower} ${flavorLower}`;

  // 1. Check if the base is inherently high-FODMAP
  if (HIGH_FODMAP_BASES.some(hb => baseLower === hb.toLowerCase())) {
    return false;
  }

  // 2. Check all high-FODMAP keywords against the full recipe text
  for (const keyword of HIGH_FODMAP_KEYWORDS) {
    if (fullText.includes(keyword.toLowerCase())) {
      return false;
    }
  }

  // 3. Check if the flavor is high-FODMAP
  if (HIGH_FODMAP_FLAVORS.some(hf => flavorLower === hf.toLowerCase())) {
    return false;
  }

  // 4. Certain categories are almost never FODMAP-safe
  // Most desserts use wheat flour, milk, or high-fructose fruits
  if (category === 'Dessert') {
    // Only allow explicitly safe desserts
    const safeDessFlavors = ['fruits rouges', 'framboise', 'au citron', 'exotiques'];
    const safeDessNames = ['sorbet'];
    if (!safeDessFlavors.some(sf => flavorLower.includes(sf)) &&
        !safeDessNames.some(sn => nameLower.includes(sn))) {
      return false;
    }
  }

  // 5. Sauces with garlic/onion base
  if (category === 'Sauce' && (nameLower.includes('ayoli') || nameLower.includes('aïoli'))) {
    return false; // Aïoli = garlic-based
  }

  // 6. Prefer marking as safe only if the base is known-safe
  if (SAFE_FODMAP_BASES.some(sb => baseLower === sb.toLowerCase())) {
    return true;
  }

  // 7. For remaining cases, be conservative: mark as NOT fodmap-safe
  // unless "Low-FODMAP" tag was explicitly applied
  if (tags && tags.includes('Low-FODMAP')) {
    return true;
  }

  // Default: not safe (conservative approach)
  return false;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const recipes = [];
const usedNames = new Set();
let idCounter = 1;

// Base recipes provided by user originally
const seedRecipes = [
  { name:'Porridge aux myrtilles', category:'Petit-déj', base: 'Porridge', flavor: 'aux myrtilles' },
  { name:'Risotto aux courgettes', category:'Plat', base: 'Risotto', flavor: 'aux courgettes' },
  { name:'Salade César revisitée', category:'Entrée', base: 'Salade', flavor: 'César' },
  { name:'Saumon grillé aux herbes', category:'Plat', base: 'Saumon grillé', flavor: 'aux herbes' },
  { name:'Spaghetti bolognaise', category:'Plat', base: 'Pâtes', flavor: 'bolognaise' },
  { name:'Fondant au chocolat', category:'Dessert', base: 'Fondant', flavor: 'au chocolat' },
];

for (const seed of seedRecipes) {
  usedNames.add(seed.name.toLowerCase());
  const emoji = randomChoice(emojis[seed.category]);
  const tags = [randomChoice(allTags), randomChoice(allTags)];
  const fodmap = isFodmapSafe(seed.name, seed.base, seed.flavor, seed.category, tags);
  recipes.push({
    id: idCounter++,
    name: seed.name,
    emoji: emoji,
    time: randomChoice(times),
    difficulty: randomChoice(difficulties),
    category: seed.category,
    fodmap,
    tags,
  });
}

const targetCount = 1000;

while (recipes.length < targetCount) {
  let categoryProb = Math.random();
  let category;
  if (categoryProb < 0.3) category = 'Plat';
  else if (categoryProb < 0.45) category = 'Dessert';
  else if (categoryProb < 0.6) category = 'Entrée';
  else if (categoryProb < 0.7) category = 'Petit-déj';
  else if (categoryProb < 0.8) category = 'Accompagnement';
  else if (categoryProb < 0.9) category = 'Collation';
  else if (categoryProb < 0.95) category = 'Boisson';
  else category = 'Sauce';

  const base = randomChoice(bases[category]);
  const flavor = randomChoice(flavors[category]);
  const name = `${base} ${flavor}`;

  if (!usedNames.has(name.toLowerCase())) {
    usedNames.add(name.toLowerCase());
    
    const numTags = Math.floor(Math.random() * 3) + 1;
    const recipeTags = [];
    for (let i = 0; i < numTags; i++) {
        let tag = randomChoice(allTags);
        if (!recipeTags.includes(tag)) recipeTags.push(tag);
    }
    
    // PROPER FODMAP verification based on ingredients, not random
    const fodmap = isFodmapSafe(name, base, flavor, category, recipeTags);

    // If recipe IS fodmap-safe and doesn't already have the tag, optionally add it
    if (fodmap && !recipeTags.includes('Low-FODMAP') && Math.random() > 0.5) {
      recipeTags.push('Low-FODMAP');
    }
    // If recipe is NOT fodmap-safe, remove the Low-FODMAP tag if present
    if (!fodmap) {
      const idx = recipeTags.indexOf('Low-FODMAP');
      if (idx !== -1) recipeTags.splice(idx, 1);
    }

    let timePool = times.slice(0, 5);
    let diff = 'Facile';
    if (Math.random() > 0.5) {
        diff = 'Moyen';
        timePool = times.slice(4, 9);
    }
    if (Math.random() > 0.8) {
        diff = 'Difficile';
        timePool = times.slice(9);
    }

    recipes.push({
      id: idCounter++,
      name: name,
      emoji: randomChoice(emojis[category]),
      time: randomChoice(timePool),
      difficulty: diff,
      category: category,
      fodmap,
      tags: recipeTags,
    });
  }
}

// Generate realistic kcal based on category
recipes.forEach(r => {
  let base = 300;
  if (r.category === 'Petit-déj') base = 350 + Math.floor(Math.random() * 150);
  else if (r.category === 'Entrée') base = 150 + Math.floor(Math.random() * 100);
  else if (r.category === 'Plat') base = 400 + Math.floor(Math.random() * 300);
  else if (r.category === 'Accompagnement') base = 100 + Math.floor(Math.random() * 150);
  else if (r.category === 'Dessert') base = 250 + Math.floor(Math.random() * 200);
  else if (r.category === 'Boisson') base = 50 + Math.floor(Math.random() * 100);
  else if (r.category === 'Collation') base = 150 + Math.floor(Math.random() * 100);
  else if (r.category === 'Sauce') base = 80 + Math.floor(Math.random() * 70);
  r.kcal = base;
});

// Stats
const fodmapSafe = recipes.filter(r => r.fodmap).length;
const fodmapUnsafe = recipes.filter(r => !r.fodmap).length;
console.log(`\nFODMAP Stats: ${fodmapSafe} safe (${(fodmapSafe/recipes.length*100).toFixed(1)}%), ${fodmapUnsafe} unsafe (${(fodmapUnsafe/recipes.length*100).toFixed(1)}%)`);

// Show some examples of flagged recipes
console.log('\nSample FODMAP-safe recipes:');
recipes.filter(r => r.fodmap).slice(0, 10).forEach(r => console.log(`  ✅ ${r.name} [${r.category}]`));
console.log('\nSample NOT FODMAP-safe recipes:');
recipes.filter(r => !r.fodmap).slice(0, 10).forEach(r => console.log(`  ❌ ${r.name} [${r.category}]`));

const output = `// Auto-generated recipe database — ${recipes.length} recipes
export interface StaticRecipe {
  id: number;
  name: string;
  emoji: string;
  time: string;
  difficulty: string;
  category: string;
  fodmap: boolean;
  tags: string[];
  kcal: number;
}

export const staticRecipes: StaticRecipe[] = ${JSON.stringify(recipes, null, 2)};

export const recipeCategories = [
  { name: 'Tous', emoji: '📚' },
  { name: 'Petit-déj', emoji: '☀️' },
  { name: 'Entrée', emoji: '🥗' },
  { name: 'Plat', emoji: '🍽️' },
  { name: 'Accompagnement', emoji: '🥕' },
  { name: 'Dessert', emoji: '🍰' },
  { name: 'Boisson', emoji: '🥤' },
  { name: 'Collation', emoji: '🍪' },
  { name: 'Sauce', emoji: '🫙' },
];
`;

fs.writeFileSync(path.join(__dirname, 'recipesData.ts'), output, 'utf-8');
console.log(`\n✅ Generated recipesData.ts with ${recipes.length} recipes`);
