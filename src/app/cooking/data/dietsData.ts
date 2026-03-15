export interface DietProtocol {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tagline: string;
  description: string;
  phases?: {
    title: string;
    duration: string;
    icon: string;
    desc: string;
    avoidFoods?: { name: string; emoji: string }[];
    okFoods?: { name: string; emoji: string }[];
    tips?: string[];
  }[];
  avoidFoods: { name: string; emoji: string }[];
  okFoods: { name: string; emoji: string }[];
  tips: string[];
}

export const diets: DietProtocol[] = [
  {
    id: 'low-fodmap',
    name: 'Low-FODMAP',
    emoji: '🧬',
    color: 'var(--ck-coral)',
    tagline: 'Identifiez vos intolérances digestives',
    description: 'Le protocole Low-FODMAP en 3 phases aide à identifier les glucides fermentescibles qui causent ballonnements, douleurs et troubles digestifs.',
    phases: [
      {
        title: 'Élimination', duration: '2–6 semaines', icon: '🚫',
        desc: 'Supprimez tous les aliments riches en FODMAP pour calmer vos symptômes digestifs.',
        avoidFoods: [
          { name: 'Ail & oignon', emoji: '🧅' }, { name: 'Blé & seigle', emoji: '🌾' },
          { name: 'Lait & yaourt', emoji: '🥛' }, { name: 'Pommes & poires', emoji: '🍎' },
        ],
        okFoods: [
          { name: 'Riz & quinoa', emoji: '🍚' }, { name: 'Carottes & courgettes', emoji: '🥕' },
          { name: 'Fraises & myrtilles', emoji: '🍓' }, { name: 'Fromages à pâte dure', emoji: '🧀' },
        ],
      },
      {
        title: 'Réintroduction', duration: '6–8 semaines', icon: '🔬',
        desc: 'Réintroduisez chaque groupe de FODMAP un par un pour identifier vos déclencheurs.',
        tips: ['Testez un seul groupe à la fois pendant 3 jours', 'Notez tous vos symptômes dans le journal', 'Revenez à l\'élimination entre chaque test'],
      },
      {
        title: 'Personnalisation', duration: 'Long terme', icon: '✨',
        desc: 'Créez votre régime personnalisé en réintégrant les aliments que vous tolérez.',
        tips: ['Notez vos tolérances dans un journal alimentaire', 'Réessayez les aliments sensibles après 3 mois', 'Consultez un diététicien pour un suivi personnalisé'],
      },
    ],
    avoidFoods: [
      { name: 'Ail & oignon', emoji: '🧅' }, { name: 'Blé & seigle', emoji: '🌾' },
      { name: 'Lait & yaourt classique', emoji: '🥛' }, { name: 'Pommes & poires', emoji: '🍎' },
      { name: 'Miel', emoji: '🍯' }, { name: 'Champignons', emoji: '🍄' },
    ],
    okFoods: [
      { name: 'Riz & quinoa', emoji: '🍚' }, { name: 'Carottes & courgettes', emoji: '🥕' },
      { name: 'Fraises & myrtilles', emoji: '🍓' }, { name: 'Parmesan & brie', emoji: '🧀' },
      { name: 'Poulet & poisson', emoji: '🐟' }, { name: 'Tofu ferme', emoji: '🧊' },
    ],
    tips: ['Tenez un journal des symptômes', 'Lisez les étiquettes attentivement', 'L\'appli Monash FODMAP est très utile'],
  },
  {
    id: 'perte-de-poids',
    name: 'Perte de poids',
    emoji: '⚖️',
    color: '#FF6B6B',
    tagline: 'Rééquilibrage alimentaire sain et durable',
    description: 'Un déficit calorique modéré avec une alimentation équilibrée riche en protéines, fibres et nutriments essentiels pour une perte de poids progressive.',
    avoidFoods: [
      { name: 'Sodas & jus industriels', emoji: '🥤' }, { name: 'Fritures', emoji: '🍟' },
      { name: 'Pâtisseries industrielles', emoji: '🍰' }, { name: 'Alcool excessif', emoji: '🍺' },
      { name: 'Plats ultra-transformés', emoji: '📦' }, { name: 'Sauces riches en calories', emoji: '🥫' },
    ],
    okFoods: [
      { name: 'Légumes à volonté', emoji: '🥬' }, { name: 'Protéines maigres', emoji: '🍗' },
      { name: 'Céréales complètes', emoji: '🌾' }, { name: 'Fruits frais', emoji: '🍎' },
      { name: 'Légumineuses', emoji: '🫘' }, { name: 'Eau & thé vert', emoji: '🍵' },
    ],
    tips: ['Visez -500 kcal/jour max', 'Mangez lentement, en pleine conscience', 'Privilégiez les protéines au petit-déj', 'Hydratez-vous avant les repas'],
  },
  {
    id: 'vegetarien',
    name: 'Végétarien',
    emoji: '🌱',
    color: '#4CAF50',
    tagline: 'Alimentation sans viande ni poisson',
    description: 'Un régime sans chair animale mais incluant les produits laitiers et les œufs. Riche en fibres, antioxydants et nutriments végétaux.',
    avoidFoods: [
      { name: 'Viande rouge', emoji: '🥩' }, { name: 'Volaille', emoji: '🍗' },
      { name: 'Poisson & fruits de mer', emoji: '🐟' }, { name: 'Gélatine animale', emoji: '🍬' },
      { name: 'Bouillon de viande', emoji: '🍖' }, { name: 'Présure animale', emoji: '🧀' },
    ],
    okFoods: [
      { name: 'Légumineuses', emoji: '🫘' }, { name: 'Tofu & tempeh', emoji: '🧊' },
      { name: 'Œufs', emoji: '🥚' }, { name: 'Produits laitiers', emoji: '🥛' },
      { name: 'Noix & graines', emoji: '🥜' }, { name: 'Céréales complètes', emoji: '🌾' },
    ],
    tips: ['Combinez légumineuses + céréales pour les protéines complètes', 'Surveillez la vitamine B12', 'Le fer végétal s\'absorbe mieux avec la vitamine C'],
  },
  {
    id: 'vegan',
    name: 'Vegan',
    emoji: '🌿',
    color: '#2E7D32',
    tagline: '100% végétal, 0% produit animal',
    description: 'Exclusion de tout produit d\'origine animale. Nécessite une planification pour couvrir tous les besoins nutritionnels.',
    avoidFoods: [
      { name: 'Viande & poisson', emoji: '🥩' }, { name: 'Produits laitiers', emoji: '🥛' },
      { name: 'Œufs', emoji: '🥚' }, { name: 'Miel', emoji: '🍯' },
      { name: 'Gélatine', emoji: '🍬' }, { name: 'Certains vins (colle animale)', emoji: '🍷' },
    ],
    okFoods: [
      { name: 'Légumineuses', emoji: '🫘' }, { name: 'Tofu, tempeh, seitan', emoji: '🧊' },
      { name: 'Lait végétal enrichi', emoji: '🥥' }, { name: 'Levure nutritionnelle', emoji: '✨' },
      { name: 'Noix & graines', emoji: '🥜' }, { name: 'Tous les fruits & légumes', emoji: '🥬' },
    ],
    tips: ['Supplémentez en B12 obligatoirement', 'Attention au calcium et à la vitamine D', 'Les graines de chia et lin apportent des oméga-3'],
  },
  {
    id: 'keto',
    name: 'Cétogène (Keto)',
    emoji: '🥑',
    color: '#FF9800',
    tagline: 'Très faible en glucides, riche en bonnes graisses',
    description: 'Moins de 50g de glucides/jour pour que le corps entre en cétose et brûle les graisses comme carburant principal.',
    avoidFoods: [
      { name: 'Pain, pâtes, riz', emoji: '🍞' }, { name: 'Sucre & bonbons', emoji: '🍭' },
      { name: 'Pommes de terre', emoji: '🥔' }, { name: 'Fruits sucrés (banane, raisin)', emoji: '🍌' },
      { name: 'Légumineuses', emoji: '🫘' }, { name: 'Jus de fruits', emoji: '🧃' },
    ],
    okFoods: [
      { name: 'Avocat', emoji: '🥑' }, { name: 'Huile d\'olive & coco', emoji: '🫒' },
      { name: 'Viande & poisson gras', emoji: '🥩' }, { name: 'Fromages', emoji: '🧀' },
      { name: 'Œufs', emoji: '🥚' }, { name: 'Noix (macadamia, pécan)', emoji: '🥜' },
    ],
    tips: ['La « grippe keto » dure 1–2 semaines', 'Hydratez-vous énormément', 'Comptez vos macros : 70% lipides, 25% protéines, 5% glucides'],
  },
  {
    id: 'mediterraneen',
    name: 'Méditerranéen',
    emoji: '🫒',
    color: '#1976D2',
    tagline: 'Le régime le plus étudié et recommandé au monde',
    description: 'Inspiré des habitudes alimentaires de la Grèce et de l\'Italie. Riche en huile d\'olive, poisson, légumes et céréales complètes.',
    avoidFoods: [
      { name: 'Viande rouge fréquente', emoji: '🥩' }, { name: 'Sucre raffiné', emoji: '🍬' },
      { name: 'Aliments ultra-transformés', emoji: '📦' }, { name: 'Beurre en excès', emoji: '🧈' },
      { name: 'Sodas', emoji: '🥤' }, { name: 'Farines blanches', emoji: '🌾' },
    ],
    okFoods: [
      { name: 'Huile d\'olive', emoji: '🫒' }, { name: 'Poisson 2-3x/semaine', emoji: '🐟' },
      { name: 'Légumes abondants', emoji: '🥬' }, { name: 'Fruits frais', emoji: '🍇' },
      { name: 'Noix & amandes', emoji: '🥜' }, { name: 'Vin rouge modéré', emoji: '🍷' },
    ],
    tips: ['Cuisinez à l\'huile d\'olive plutôt qu\'au beurre', 'Mangez du poisson 2 à 3 fois par semaine', 'Abusez des herbes aromatiques fraîches'],
  },
  {
    id: 'sans-gluten',
    name: 'Sans Gluten',
    emoji: '🌾',
    color: '#8D6E63',
    tagline: 'Élimination du gluten pour les intolérants et cœliaques',
    description: 'Suppression totale du blé, orge, seigle et leurs dérivés. Indispensable pour les cœliaques, bénéfique pour certains sensibles.',
    avoidFoods: [
      { name: 'Blé (pain, pâtes, couscous)', emoji: '🍞' }, { name: 'Orge (bière classique)', emoji: '🍺' },
      { name: 'Seigle', emoji: '🌾' }, { name: 'Épeautre & kamut', emoji: '🌿' },
      { name: 'Sauces avec épaississant gluten', emoji: '🥫' }, { name: 'Panure classique', emoji: '🍗' },
    ],
    okFoods: [
      { name: 'Riz & quinoa', emoji: '🍚' }, { name: 'Maïs & polenta', emoji: '🌽' },
      { name: 'Sarrasin', emoji: '🥞' }, { name: 'Pommes de terre', emoji: '🥔' },
      { name: 'Millet & amarante', emoji: '🌾' }, { name: 'Toutes les viandes & poissons', emoji: '🐟' },
    ],
    tips: ['Attention aux contaminations croisées en cuisine', 'Vérifiez le logo « épi barré »', 'Le sarrasin est naturellement sans gluten malgré son nom'],
  },
  {
    id: 'sans-lactose',
    name: 'Sans Lactose',
    emoji: '🥛',
    color: '#42A5F5',
    tagline: 'Pour les intolérants au lactose',
    description: 'Réduction ou suppression du lactose, le sucre naturel du lait. Touche environ 70% de la population mondiale.',
    avoidFoods: [
      { name: 'Lait de vache', emoji: '🥛' }, { name: 'Crème fraîche', emoji: '🍶' },
      { name: 'Glaces classiques', emoji: '🍦' }, { name: 'Fromages frais', emoji: '🧀' },
      { name: 'Beurre en grande quantité', emoji: '🧈' }, { name: 'Yaourts nature', emoji: '🥛' },
    ],
    okFoods: [
      { name: 'Fromages affinés (comté, parmesan)', emoji: '🧀' }, { name: 'Lait végétal', emoji: '🥥' },
      { name: 'Yaourt de coco/soja', emoji: '🥥' }, { name: 'Beurre clarifié (ghee)', emoji: '🧈' },
      { name: 'Lait sans lactose', emoji: '🥛' }, { name: 'Crème de coco', emoji: '🥥' },
    ],
    tips: ['Les fromages affinés >6 mois contiennent très peu de lactose', 'Le lactose se cache dans beaucoup de plats préparés', 'La lactase en comprimés peut aider ponctuellement'],
  },
  {
    id: 'paleo',
    name: 'Paléo',
    emoji: '🦴',
    color: '#795548',
    tagline: 'Manger comme nos ancêtres chasseurs-cueilleurs',
    description: 'Alimentation basée sur ce que mangeaient les humains du paléolithique : viandes, poissons, légumes, fruits, noix. Pas de produits transformés.',
    avoidFoods: [
      { name: 'Céréales (blé, riz, maïs)', emoji: '🌾' }, { name: 'Produits laitiers', emoji: '🥛' },
      { name: 'Légumineuses', emoji: '🫘' }, { name: 'Sucre raffiné', emoji: '🍬' },
      { name: 'Huiles végétales industrielles', emoji: '🫗' }, { name: 'Aliments transformés', emoji: '📦' },
    ],
    okFoods: [
      { name: 'Viandes élevées en plein air', emoji: '🥩' }, { name: 'Poisson sauvage', emoji: '🐟' },
      { name: 'Légumes frais', emoji: '🥬' }, { name: 'Fruits', emoji: '🍎' },
      { name: 'Noix & graines', emoji: '🥜' }, { name: 'Huile d\'olive & avocat', emoji: '🥑' },
    ],
    tips: ['Privilégiez la viande de qualité (bio, plein air)', 'Ce régime est naturellement sans gluten', 'Attention aux carences en calcium sans produits laitiers'],
  },
  {
    id: 'anti-inflammatoire',
    name: 'Anti-inflammatoire',
    emoji: '🔥',
    color: '#E91E63',
    tagline: 'Réduire l\'inflammation chronique par l\'alimentation',
    description: 'Focus sur les aliments riches en antioxydants, oméga-3 et polyphénols pour combattre l\'inflammation chronique liée aux maladies modernes.',
    avoidFoods: [
      { name: 'Sucre raffiné', emoji: '🍬' }, { name: 'Aliments ultra-transformés', emoji: '📦' },
      { name: 'Huiles de tournesol/maïs', emoji: '🫗' }, { name: 'Viande rouge fréquente', emoji: '🥩' },
      { name: 'Alcool excessif', emoji: '🍺' }, { name: 'Gluten (si sensible)', emoji: '🌾' },
    ],
    okFoods: [
      { name: 'Poissons gras (saumon, sardines)', emoji: '🐟' }, { name: 'Curcuma & gingembre', emoji: '🫚' },
      { name: 'Baies & fruits rouges', emoji: '🫐' }, { name: 'Légumes verts foncés', emoji: '🥬' },
      { name: 'Noix & graines de lin', emoji: '🥜' }, { name: 'Huile d\'olive extra vierge', emoji: '🫒' },
    ],
    tips: ['Le curcuma + poivre noir = absorption x2000', 'Les oméga-3 sont les plus puissants anti-inflammatoires naturels', 'Dormez 7-9h — le manque de sommeil augmente l\'inflammation'],
  },
  {
    id: 'jeune-intermittent',
    name: 'Jeûne Intermittent',
    emoji: '⏰',
    color: '#9C27B0',
    tagline: 'Alterner périodes de jeûne et d\'alimentation',
    description: 'Pas un régime sur QUOI manger mais QUAND manger. Le protocole 16:8 (16h de jeûne, 8h d\'alimentation) est le plus populaire.',
    avoidFoods: [
      { name: 'Tout aliment pendant le jeûne', emoji: '🚫' }, { name: 'Boissons sucrées (brisent le jeûne)', emoji: '🥤' },
      { name: 'Chewing-gum sucré', emoji: '🍬' }, { name: 'Compléments caloriques', emoji: '💊' },
      { name: 'Crème dans le café', emoji: '☕' }, { name: 'Bouillon riche en calories', emoji: '🍲' },
    ],
    okFoods: [
      { name: 'Eau, thé, café noir (pendant jeûne)', emoji: '💧' }, { name: 'Repas équilibrés pendant la fenêtre', emoji: '🍽️' },
      { name: 'Protéines de qualité', emoji: '🥩' }, { name: 'Légumes fibreux', emoji: '🥬' },
      { name: 'Bonnes graisses', emoji: '🥑' }, { name: 'Fruits modérément', emoji: '🍎' },
    ],
    tips: ['Commencez par 12h de jeûne et augmentez progressivement', 'Ne compensez pas en mangeant 2x plus', 'Le café noir n\'interrompt pas le jeûne'],
  },
  {
    id: 'dash',
    name: 'DASH',
    emoji: '❤️',
    color: '#D32F2F',
    tagline: 'Conçu pour réduire l\'hypertension',
    description: 'Dietary Approaches to Stop Hypertension. Riche en fruits, légumes, céréales complètes et pauvre en sel et graisses saturées.',
    avoidFoods: [
      { name: 'Sel / sodium excessif', emoji: '🧂' }, { name: 'Viande rouge fréquente', emoji: '🥩' },
      { name: 'Sucres ajoutés', emoji: '🍬' }, { name: 'Boissons sucrées', emoji: '🥤' },
      { name: 'Graisses saturées en excès', emoji: '🧈' }, { name: 'Aliments ultra-salés', emoji: '🥨' },
    ],
    okFoods: [
      { name: 'Légumes variés (4-5 portions/jour)', emoji: '🥬' }, { name: 'Fruits frais (4-5 portions/jour)', emoji: '🍎' },
      { name: 'Céréales complètes', emoji: '🌾' }, { name: 'Produits laitiers allégés', emoji: '🥛' },
      { name: 'Noix & graines (4-5x/semaine)', emoji: '🥜' }, { name: 'Poisson & volaille', emoji: '🐟' },
    ],
    tips: ['Réduisez le sel à <2300mg/jour (idéal <1500mg)', 'Augmentez le potassium (bananes, épinards)', 'Ce régime est classé #1 par les nutritionnistes US'],
  },
];
