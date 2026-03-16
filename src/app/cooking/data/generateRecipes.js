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

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const recipes = [];
const usedNames = new Set();
let idCounter = 1;

// Base recipes provided by user originally (keep some of the 190 nice ones)
const seedRecipes = [
  { name:'Porridge aux myrtilles', category:'Petit-déj', base: 'Porridge' },
  { name:'Risotto aux courgettes', category:'Plat', base: 'Risotto' },
  { name:'Salade César revisitée', category:'Entrée', base: 'Salade' },
  { name:'Saumon grillé aux herbes', category:'Plat', base: 'Saumon grillé' },
  { name:'Spaghetti bolognaise', category:'Plat', base: 'Pâtes' },
  { name:'Fondant au chocolat', category:'Dessert', base: 'Fondant' },
];

for (const seed of seedRecipes) {
  usedNames.add(seed.name.toLowerCase());
  const emoji = randomChoice(emojis[seed.category]);
  recipes.push({
    id: idCounter++,
    name: seed.name,
    emoji: emoji,
    time: randomChoice(times),
    difficulty: randomChoice(difficulties),
    category: seed.category,
    fodmap: Math.random() > 0.5,
    tags: [randomChoice(allTags), randomChoice(allTags)],
  });
}

const targetCount = 1000;

while (recipes.length < targetCount) {
  // Pick category
  let categoryProb = Math.random();
  let category;
  if (categoryProb < 0.3) category = 'Plat'; // 30% plats
  else if (categoryProb < 0.45) category = 'Dessert'; // 15% desserts
  else if (categoryProb < 0.6) category = 'Entrée'; // 15% entrées
  else if (categoryProb < 0.7) category = 'Petit-déj'; // 10%
  else if (categoryProb < 0.8) category = 'Accompagnement'; // 10%
  else if (categoryProb < 0.9) category = 'Collation'; // 10%
  else if (categoryProb < 0.95) category = 'Boisson'; // 5%
  else category = 'Sauce'; // 5%

  const base = randomChoice(bases[category]);
  const flavor = randomChoice(flavors[category]);
  const name = `${base} ${flavor}`;

  if (!usedNames.has(name.toLowerCase())) {
    usedNames.add(name.toLowerCase());
    
    // Shuffle tags 
    const numTags = Math.floor(Math.random() * 3) + 1; // 1 to 3 tags
    const recipeTags = [];
    for (let i = 0; i < numTags; i++) {
        let tag = randomChoice(allTags);
        if (!recipeTags.includes(tag)) recipeTags.push(tag);
    }
    
    const isFodmap = recipeTags.includes('Low-FODMAP') ? true : Math.random() > 0.6;
    
    // Logic for time based on difficulty
    let timePool = times.slice(0, 5); // easy times
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
      fodmap: isFodmap,
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
console.log(`✅ Generated recipesData.ts with ${recipes.length} recipes`);
