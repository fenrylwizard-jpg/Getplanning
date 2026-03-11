import os

base_path = "c:\\Users\\Imam\\.gemini\\antigravity\\scratch\\worksite-tracker\\public"
fr_path = os.path.join(base_path, "presentation.html")
en_path = os.path.join(base_path, "presentation-en.html")
nl_path = os.path.join(base_path, "presentation-nl.html")

with open(fr_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add lang-switcher CSS
css_to_add = """
        /* ── LANG SWITCHER ── */
        .lang-switcher { display: flex; gap: 0.5rem; }
        .lang-switcher a { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: 6px; transition: all 0.3s; background: rgba(255,255,255,0.05); }
        .lang-switcher a:hover { color: var(--cyan); background: rgba(255,255,255,0.1); }
        .lang-switcher a.active { color: #000; background: var(--cyan); }
"""
if "/* ── LANG SWITCHER ── */" not in content:
    content = content.replace("/* ── HERO ── */", css_to_add + "\n        /* ── HERO ── */")

# Update nav
nav_search = """<div class="nav-links">
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#roles">Rôles</a>
            <a href="#workflow">Workflow</a>
            <a href="#analytics">Analytics</a>
        </div>"""
        
nav_replace_fr = """<div style="display: flex; align-items: center; gap: 2rem;">
            <div class="nav-links" id="nav-links">
                <a href="#fonctionnalites">Fonctionnalités</a>
                <a href="#roles">Rôles</a>
                <a href="#workflow">Workflow</a>
                <a href="#analytics">Analytics</a>
            </div>
            <div class="lang-switcher">
                <a href="presentation.html" class="active">FR</a>
                <a href="presentation-en.html">EN</a>
                <a href="presentation-nl.html">NL</a>
            </div>
        </div>"""

if "lang-switcher" not in content:
    content_fr = content.replace(nav_search, nav_replace_fr)
else:
    content_fr = content

with open(fr_path, 'w', encoding='utf-8') as f:
    f.write(content_fr)

# English version
nav_replace_en = nav_replace_fr.replace('class="active">FR', '>FR').replace('presentation-en.html">EN', 'presentation-en.html" class="active">EN')
nav_replace_en = nav_replace_en.replace('Fonctionnalités', 'Features').replace('Rôles', 'Roles').replace('Workflow', 'Workflow').replace('Analytics', 'Analytics')
nav_replace_en = nav_replace_en.replace('#fonctionnalites', '#features').replace('#roles', '#roles').replace('#workflow', '#workflow').replace('#analytics', '#analytics')

content_en = content_fr.replace('lang="fr"', 'lang="en"')
content_en = content_en.replace(nav_replace_fr, nav_replace_en)

# Replace IDs
content_en = content_en.replace('id="fonctionnalites"', 'id="features"')
content_en = content_en.replace('id="roles"', 'id="roles"')
content_en = content_en.replace('id="workflow"', 'id="workflow"')
content_en = content_en.replace('id="analytics"', 'id="analytics"')

replacements_en = {
    "Présentation": "Presentation",
    "⚡ Plateforme SaaS de Nouvelle Génération": "⚡ Next-Generation SaaS Platform",
    "Maîtrisez la<br>": "Master your<br>",
    "planification de vos chantiers": "construction site planning",
    "Pilotez vos projets de construction avec précision. Planification hebdomadaire, rapports terrain en temps réel, analytics avancées et gamification pour motiver vos équipes.": "Manage your construction projects with precision. Weekly planning, real-time field reports, advanced analytics, and gamification to motivate your teams.",
    "Rôles Métier": "Business Roles",
    "Langues": "Languages",
    "Projets simultanés": "Simultaneous projects",
    "Accès terrain": "Field access",
    "FONCTIONNALITÉS": "FEATURES",
    "Tout ce qu'il faut pour piloter vos chantiers": "Everything you need to manage your construction sites",
    "Une suite complète d'outils conçus pour les professionnels du BTP et de l'installation technique.": "A complete suite of tools designed for construction and technical installation professionals.",
    "Planification Multi-Semaines": "Multi-Week Planning",
    "Planifiez vos tâches sur S+1, S+2 et S+3 avec un système de panier intuitif.": "Plan your tasks for W+1, W+2 and W+3 with an intuitive basket system.",
    "Sélection par catégorie & poste": "Selection by category & position",
    "Localisation par zone du chantier": "Localization by site zone",
    "Checklist de préparation (Plans, Matériaux, Outils)": "Preparation checklist (Plans, Materials, Tools)",
    "Objectif horaire automatique": "Automatic time objective",
    "Rapports Quotidiens": "Daily Reports",
    "Le Chef de Chantier saisit chaque jour l'avancement réel, les présences et les problèmes rencontrés.": "The Site Manager enters actual progress, attendance, and issues encountered every day.",
    "Saisie des quantités exécutées": "Entry of executed quantities",
    "Comptage de la main-d'œuvre": "Workforce counting",
    "Preuves visuelles (photos terrain)": "Visual proofs (field photos)",
    "Signalement de blocages (RCA)": "Reporting of blockages (RCA)",
    "Tableaux de bord interactifs avec Earned Value Management, heatmaps de productivité et analyses croisées.": "Interactive dashboards with Earned Value Management, productivity heatmaps, and cross-analyses.",
    "Valeur Planifiée vs Acquise vs Brûlée": "Planned vs Earned vs Burned Value",
    "Productivité par catégorie métier": "Productivity by trade category",
    "Benchmarking inter-chantiers": "Cross-site benchmarking",
    "Import Budget Excel": "Excel Budget Import",
    "Importez votre Bordereau de Prix directement depuis un fichier Excel. Zones pré-remplies automatiquement.": "Import your Bill of Quantities directly from an Excel file. Automatically pre-filled zones.",
    "Détection automatique des colonnes": "Automatic column detection",
    "Catégories & sous-catégories": "Categories & sub-categories",
    "Template téléchargeable pré-rempli": "Downloadable pre-filled template",
    "Reprise d'historique intégrée": "Integrated history recovery",
    "Gamification RPG": "RPG Gamification",
    "Système de niveaux, XP et badges pour motiver vos équipes terrain. Chaque objectif atteint rapporte de l'expérience.": "Level, XP, and badge system to motivate your field teams. Each achieved objective grants experience.",
    "Personnages RPG uniques": "Unique RPG characters",
    "Système de streaks (jours consécutifs)": "Streaks system (consecutive days)",
    "Badges de performance": "Performance badges",
    "Classement inter-personnel": "Inter-personnel ranking",
    "Multilingue & Accessible": "Multilingual & Accessible",
    "Interface disponible en Français, Anglais et Néerlandais. Conçue pour une utilisation terrain sur mobile.": "Interface available in French, English, and Dutch. Designed for field use on mobile.",
    "3 langues (FR / EN / NL)": "3 languages (FR / EN / NL)",
    "Responsive mobile-first": "Responsive mobile-first",
    "Mode hors-ligne (sauvegarde locale)": "Offline mode (local saving)",
    "Synchronisation automatique": "Automatic synchronization",
    "RÔLES & RESPONSABILITÉS": "ROLES & RESPONSIBILITIES",
    "Trois rôles, un seul objectif": "Three roles, one single objective",
    "Chaque acteur du chantier dispose d'un tableau de bord adapté à ses responsabilités.": "Each actor on the construction site has a dashboard adapted to their responsibilities.",
    "Chef de Chantier (SM)": "Site Manager (SM)",
    "🔧 L'Exécutant Terrain": "🔧 The Field Executor",
    "Le Chef de Chantier est au cœur de l'action. Il planifie les semaines à venir, rapporte l'avancement quotidien et gagne de l'expérience en atteignant ses objectifs.": "The Site Manager is at the heart of the action. They plan the coming weeks, report daily progress, and gain experience by achieving their objectives.",
    "Planification Hebdomadaire": "Weekly Planning",
    "Sélection des tâches, quantités par zone, checklist de préparation (S+1 à S+3).": "Task selection, quantities by zone, preparation checklist (W+1 to W+3).",
    "Rapport Quotidien": "Daily Report",
    "Quantités exécutées, main-d'œuvre présente, photos de preuve et signalements.": "Executed quantities, present workforce, proof photos, and reports.",
    "Progression RPG": "RPG Progression",
    "XP, niveaux, personnages et badges gagnés en atteignant les objectifs hebdomadaires.": "XP, levels, characters, and badges earned by achieving weekly objectives.",
    "Historique": "History",
    "Consultation des plans passés, taux de réalisation et tendances sur le temps.": "Consultation of past plans, completion rates, and trends over time.",
    "Chef de Projet (PM)": "Project Manager (PM)",
    "📐 Le Stratège": "📐 The Strategist",
    "Le Chef de Projet supervise l'ensemble des installations, pilote les budgets et analyse la rentabilité de chaque chantier.": "The Project Manager supervises all installations, manages budgets, and analyzes the profitability of each construction site.",
    "Création de Projets": "Project Creation",
    "Import du Bordereau de Prix, assignation du SM, définition des zones.": "Import of the Bill of Quantities, assignment of the SM, definition of zones.",
    "Suivi Budgétaire": "Budget Tracking",
    "Heures planifiées vs exécutées, taux de rentabilité, progression globale.": "Planned vs executed hours, profitability rate, overall progression.",
    "EVM & Analytics": "EVM & Analytics",
    "Valeur acquise, valeur planifiée, heures brûlées — visualisations avancées.": "Earned value, planned value, burned hours — advanced visualizations.",
    "Vue Détaillée des Plans": "Detailed View of Plans",
    "Accès aux détails de chaque plan hebdomadaire avec statut et productivité.": "Access to the details of each weekly plan with status and productivity.",
    "Administrateur": "Administrator",
    "🛡️ Le Superviseur Global": "🛡️ The Global Supervisor",
    "L'Administrateur a une vision 360° sur l'ensemble du parc de chantiers, gère les comptes utilisateurs et déclenche les clôtures hebdomadaires.": "The Administrator has a 360° view of the entire portfolio of construction sites, manages user accounts, and triggers weekly closures.",
    "Tableau de Bord Global": "Global Dashboard",
    "KPIs clés : projets actifs, taux d'objectifs, heures MO totales.": "Key KPIs: active projects, objective rates, total labor hours.",
    "Gestion des Comptes": "Account Management",
    "Approbation/rejet des inscriptions, gestion des rôles (SM, PM, Admin).": "Approval/rejection of registrations, role management (SM, PM, Admin).",
    "Graphiques de Performance": "Performance Charts",
    "Courbes de valeur gagnée par projet sur le temps avec zoom interactif.": "Earned value curves by project over time with interactive zoom.",
    "Classement du Personnel": "Personnel Ranking",
    "Ranking par XP et niveau avec les avatars RPG de chaque membre.": "Ranking by XP and level with the RPG avatars of each member.",
    "WORKFLOW HEBDOMADAIRE": "WEEKLY WORKFLOW",
    "Du plan à l'exécution": "From plan to execution",
    "Un cycle complet de gestion, de la planification à la clôture, en passant par le terrain.": "A complete management cycle, from planning to closure, through the field.",
    "1. Import du Budget": "1. Budget Import",
    "Le Chef de Projet crée le chantier en important le Bordereau de Prix Excel. Les tâches, catégories et zones sont automatiquement générées.": "The Project Manager creates the construction site by importing the Excel Bill of Quantities. Tasks, categories, and zones are automatically generated.",
    "2. Planification S+1": "2. W+1 Planning",
    "Le Chef de Chantier sélectionne les tâches à exécuter la semaine prochaine, définit les quantités par zone et valide la checklist de préparation (plans, matériaux, outils).": "The Site Manager selects the tasks to be executed next week, defines the quantities by zone, and validates the preparation checklist (plans, materials, tools).",
    "3. Rapports Quotidiens": "3. Daily Reports",
    "Chaque jour, le SM rapporte les quantités réellement exécutées, le nombre de travailleurs présents et joint des photos de preuve si nécessaire. En cas de blocage, il catégorise la cause (RCA).": "Every day, the SM reports the actually executed quantities, the number of present workers, and attaches proof photos if necessary. In case of a blockage, they categorize the cause (RCA).",
    "4. Suivi & Analytics": "4. Tracking & Analytics",
    "Le PM et l'Admin suivent la progression en temps réel via les tableaux de bord : productivité par catégorie, EVM, taux d'objectifs atteints et analyses RCA.": "The PM and Admin track progress in real-time via dashboards: productivity by category, EVM, objective achievement rates, and RCA analyses.",
    "5. Clôture & XP": "5. Closure & XP",
    "La semaine est clôturée automatiquement (ou manuellement par l'Admin). Le système calcule si l'objectif est atteint et attribue l'XP au Chef de Chantier. Le cycle recommence.": "The week is closed automatically (or manually by the Admin). The system calculates whether the objective has been reached and grants XP to the Site Manager. The cycle begins anew.",
    "ANALYTICS AVANCÉES": "ADVANCED ANALYTICS",
    "Des données au service de la décision": "Data serving decision-making",
    "Visualisations interactives pour comprendre la performance de vos chantiers en un coup d'œil.": "Interactive visualizations to understand the performance of your construction sites at a glance.",
    "Analyse de Causes": "Root Cause Analysis",
    "Heatmap Productivité": "Productivity Heatmap",
    "Benchmarking": "Benchmarking",
    "Suivez l'évolution cumulée de vos chantiers avec trois courbes clés :": "Track the cumulative evolution of your construction sites with three key curves:",
    "Valeur Planifiée (heures prévues)": "Planned Value (predicted hours)",
    "Valeur Acquise (heures valorisées)": "Earned Value (valued hours)",
    "Coût Réel (heures brûlées)": "Actual Cost (burned hours)",
    "Analyse des Causes (RCA)": "Root Cause Analysis (RCA)",
    "Quand un objectif n'est pas atteint, le Chef de Chantier catégorise la cause du retard :": "When an objective is not met, the Site Manager categorizes the cause of the delay:",
    "Retard Matériel": "Material Delay",
    "Météo": "Weather",
    "Panne d'Équipement": "Equipment Breakdown",
    "Main-d'œuvre": "Workforce",
    "Erreur de Planification": "Planning Error",
    "TECHNOLOGIE": "TECHNOLOGY",
    "Architecture Moderne & Sécurisée": "Modern & Secure Architecture",
    "Construite avec les technologies web les plus performantes pour garantir fiabilité et rapidité.": "Built with top-performing web technologies to ensure reliability and speed.",
    "Framework React full-stack avec rendu côté serveur et optimisation automatique.": "Full-stack React framework with server-side rendering and automatic optimization.",
    "Base de données relationnelle robuste avec ORM type-safe pour la fiabilité des données.": "Robust relational database with type-safe ORM for data reliability.",
    "Contrôle d'accès basé sur les rôles (RBAC) avec tokens sécurisés et validation serveur.": "Role-Based Access Control (RBAC) with secure tokens and server validation.",
    "Prêt à transformer vos chantiers ?": "Ready to transform your construction sites?",
    "Rejoignez les équipes qui optimisent leur productivité avec EEG GetPlanning.": "Join the teams that optimize their productivity with EEG GetPlanning.",
    "Accéder à la plateforme →": "Access to platform →",
    "Tous droits réservés": "All rights reserved"
}

for fr, en in replacements_en.items():
    content_en = content_en.replace(fr, en)

with open(en_path, 'w', encoding='utf-8') as f:
    f.write(content_en)

# Dutch version
nav_replace_nl = nav_replace_fr.replace('class="active">FR', '>FR').replace('presentation-nl.html">NL', 'presentation-nl.html" class="active">NL')
nav_replace_nl = nav_replace_nl.replace('Fonctionnalités', 'Functies').replace('Rôles', 'Rollen').replace('Workflow', 'Workflow').replace('Analytics', 'Analytics')
nav_replace_nl = nav_replace_nl.replace('#fonctionnalites', '#functies').replace('#roles', '#rollen').replace('#workflow', '#workflow').replace('#analytics', '#analytics')

content_nl = content_fr.replace('lang="fr"', 'lang="nl"')
content_nl = content_nl.replace(nav_replace_fr, nav_replace_nl)

# Replace IDs
content_nl = content_nl.replace('id="fonctionnalites"', 'id="functies"')
content_nl = content_nl.replace('id="roles"', 'id="rollen"')
content_nl = content_nl.replace('id="workflow"', 'id="workflow"')
content_nl = content_nl.replace('id="analytics"', 'id="analytics"')

replacements_nl = {
    "Présentation": "Presentatie",
    "⚡ Plateforme SaaS de Nouvelle Génération": "⚡ Next-Generation SaaS Platform",
    "Maîtrisez la<br>": "Beheers uw<br>",
    "planification de vos chantiers": "werfplanning",
    "Pilotez vos projets de construction avec précision. Planification hebdomadaire, rapports terrain en temps réel, analytics avancées et gamification pour motiver vos équipes.": "Beheer uw bouwprojecten met precisie. Wekelijkse planning, realtime veldrapporten, geavanceerde analyses en gamificatie om uw teams te motiveren.",
    "Rôles Métier": "Bedrijfsrollen",
    "Langues": "Talen",
    "Projets simultanés": "Gelijktijdige projecten",
    "Accès terrain": "Toegang terrein",
    "FONCTIONNALITÉS": "FUNCTIES",
    "Tout ce qu'il faut pour piloter vos chantiers": "Alles wat u nodig heeft om uw werven te beheren",
    "Une suite complète d'outils conçus pour les professionnels du BTP et de l'installation technique.": "Een complete reeks tools ontworpen voor professionals in de bouw en technische installaties.",
    "Planification Multi-Semaines": "Meerwekenplanning",
    "Planifiez vos tâches sur S+1, S+2 et S+3 avec un système de panier intuitif.": "Plan uw taken voor W+1, W+2 en W+3 met een intuïtief mandjessysteem.",
    "Sélection par catégorie & poste": "Selectie per categorie & functie",
    "Localisation par zone du chantier": "Lokalisatie per werfzone",
    "Checklist de préparation (Plans, Matériaux, Outils)": "Voorbereidingschecklist (Plannen, Materialen, Gereedschap)",
    "Objectif horaire automatique": "Automatisch tijdsdoel",
    "Rapports Quotidiens": "Dagelijkse Rapporten",
    "Le Chef de Chantier saisit chaque jour l'avancement réel, les présences et les problèmes rencontrés.": "De werfleider voert elke dag de werkelijke voortgang, aanwezigheden en ondervonden problemen in.",
    "Saisie des quantités exécutées": "Invoer van uitgevoerde hoeveelheden",
    "Comptage de la main-d'œuvre": "Tellen van arbeidskrachten",
    "Preuves visuelles (photos terrain)": "Visueel bewijs (werffoto's)",
    "Signalement de blocages (RCA)": "Rapportage van blokkades (RCA)",
    "Tableaux de bord interactifs avec Earned Value Management, heatmaps de productivité et analyses croisées.": "Interactieve dashboards met Earned Value Management, productiviteits-heatmaps en kruisanalyses.",
    "Valeur Planifiée vs Acquise vs Brûlée": "Geplande vs Verdiende vs Verbrande Waarde",
    "Productivité par catégorie métier": "Productiviteit per beroepscategorie",
    "Benchmarking inter-chantiers": "Cross-site benchmarking",
    "Import Budget Excel": "Excel Budget Import",
    "Importez votre Bordereau de Prix directement depuis un fichier Excel. Zones pré-remplies automatiquement.": "Importeer uw meetstaat rechtstreeks vanuit een Excel-bestand. Automatisch vooraf ingevulde zones.",
    "Détection automatique des colonnes": "Automatische kolomdetectie",
    "Catégories & sous-catégories": "Categorieën & subcategorieën",
    "Template téléchargeable pré-rempli": "Downloadbare vooraf ingevulde sjabloon",
    "Reprise d'historique intégrée": "Geïntegreerd historisch herstel",
    "Gamification RPG": "RPG Gamificatie",
    "Système de niveaux, XP et badges pour motiver vos équipes terrain. Chaque objectif atteint rapporte de l'expérience.": "Niveau-, XP- en badgesysteem om uw veldteams te motiveren. Elk behaald doel levert ervaring op.",
    "Personnages RPG uniques": "Unieke RPG-personages",
    "Système de streaks (jours consécutifs)": "Streaks-systeem (opeenvolgende dagen)",
    "Badges de performance": "Prestatiebadges",
    "Classement inter-personnel": "Onderlinge ranking personeel",
    "Multilingue & Accessible": "Meertalig & Toegankelijk",
    "Interface disponible en Français, Anglais et Néerlandais. Conçue pour une utilisation terrain sur mobile.": "Interface beschikbaar in het Frans, Engels en Nederlands. Ontworpen voor gebruik op het terrein via mobiel.",
    "3 langues (FR / EN / NL)": "3 talen (FR / EN / NL)",
    "Responsive mobile-first": "Responsief mobile-first",
    "Mode hors-ligne (sauvegarde locale)": "Offline modus (lokale opslag)",
    "Synchronisation automatique": "Automatische synchronisatie",
    "RÔLES & RESPONSABILITÉS": "ROLLEN & VERANTWOORDELIJKHEDEN",
    "Trois rôles, un seul objectif": "Drie rollen, één enkel doel",
    "Chaque acteur du chantier dispose d'un tableau de bord adapté à ses responsabilités.": "Elke actor op de bouwplaats heeft een dashboard aangepast aan zijn verantwoordelijkheden.",
    "Chef de Chantier (SM)": "Werfleider (SM)",
    "🔧 L'Exécutant Terrain": "🔧 De Uitvoerder op het Terrein",
    "Le Chef de Chantier est au cœur de l'action. Il planifie les semaines à venir, rapporte l'avancement quotidien et gagne de l'expérience en atteignant ses objectifs.": "De Werfleider bevindt zich in het hart van de actie. Hij plant de komende weken, rapporteert de dagelijkse voortgang en doet ervaring op door zijn doelen te bereiken.",
    "Planification Hebdomadaire": "Wekelijkse Planning",
    "Sélection des tâches, quantités par zone, checklist de préparation (S+1 à S+3).": "Taakselectie, hoeveelheden per zone, voorbereidingschecklist (W+1 tot W+3).",
    "Rapport Quotidien": "Dagelijks Rapport",
    "Quantités exécutées, main-d'œuvre présente, photos de preuve et signalements.": "Uitgevoerde hoeveelheden, aanwezige arbeidskrachten, bewijsfoto's en meldingen.",
    "Progression RPG": "RPG Progressie",
    "XP, niveaux, personnages et badges gagnés en atteignant les objectifs hebdomadaires.": "XP, niveaus, personages en badges verdiend door het bereiken van wekelijkse doelen.",
    "Historique": "Geschiedenis",
    "Consultation des plans passés, taux de réalisation et tendances sur le temps.": "Raadpleging van eerdere plannen, voltooiingspercentages en trends over tijd.",
    "Chef de Projet (PM)": "Projectleider (PM)",
    "📐 Le Stratège": "📐 De Strateeg",
    "Le Chef de Projet supervise l'ensemble des installations, pilote les budgets et analyse la rentabilité de chaque chantier.": "De Projectleider houdt toezicht op alle installaties, beheert budgetten en analyseert de winstgevendheid van elke bouwplaats.",
    "Création de Projets": "Projectcreatie",
    "Import du Bordereau de Prix, assignation du SM, définition des zones.": "Import van de meetstaat, toewijzing van de SM, definitie van zones.",
    "Suivi Budgétaire": "Budgetopvolging",
    "Heures planifiées vs exécutées, taux de rentabilité, progression globale.": "Geplande vs uitgevoerde uren, winstgevendheidspercentage, algemene progressie.",
    "EVM & Analytics": "EVM & Analytics",
    "Valeur acquise, valeur planifiée, heures brûlées — visualisations avancées.": "Verdiende waarde, geplande waarde, verbrande uren — geavanceerde visualisaties.",
    "Vue Détaillée des Plans": "Gedetailleerde Weergave Plannen",
    "Accès aux détails de chaque plan hebdomadaire avec statut et productivité.": "Toegang tot de details van elk wekelijks plan met status en productiviteit.",
    "Administrateur": "Beheerder",
    "🛡️ Le Superviseur Global": "🛡️ De Globale Supervisor",
    "L'Administrateur a une vision 360° sur l'ensemble du parc de chantiers, gère les comptes utilisateurs et déclenche les clôtures hebdomadaires.": "De Beheerder heeft een 360° beeld van de volledige wervenportefeuille, beheert gebruikersaccounts en start wekelijkse afsluitingen.",
    "Tableau de Bord Global": "Globaal Dashboard",
    "KPIs clés : projets actifs, taux d'objectifs, heures MO totales.": "Belangrijkste KPI's: actieve projecten, doelpercentages, totale arbeidsuren.",
    "Gestion des Comptes": "Accountbeheer",
    "Approbation/rejet des inscriptions, gestion des rôles (SM, PM, Admin).": "Goedkeuring/afwijzing van registraties, rolbeheer (SM, PM, Admin).",
    "Graphiques de Performance": "Prestatiegrafieken",
    "Courbes de valeur gagnée par projet sur le temps avec zoom interactif.": "Verdiende waarde curven per project in de tijd met interactieve zoom.",
    "Classement du Personnel": "Personeelsrangschikking",
    "Ranking par XP et niveau avec les avatars RPG de chaque membre.": "Rangschikking op XP en niveau met de RPG-avatars van elk lid.",
    "WORKFLOW HEBDOMADAIRE": "WEKELIJKSE WORKFLOW",
    "Du plan à l'exécution": "Van plan tot uitvoering",
    "Un cycle complet de gestion, de la planification à la clôture, en passant par le terrain.": "Een complete beheeringscyclus, van planning tot afsluiting, via het veld.",
    "1. Import du Budget": "1. Budget Import",
    "Le Chef de Projet crée le chantier en important le Bordereau de Prix Excel. Les tâches, catégories et zones sont automatiquement générées.": "De Projectleider creëert de bouwplaats door de Excel-meetstaat te importeren. Taken, categorieën en zones worden automatisch gegenereerd.",
    "2. Planification S+1": "2. W+1 Planning",
    "Le Chef de Chantier sélectionne les tâches à exécuter la semaine prochaine, définit les quantités par zone et valide la checklist de préparation (plans, matériaux, outils).": "De Werfleider selecteert de uit te voeren taken voor de komende week, bepaalt de hoeveelheden per zone en valideert de voorbereidingschecklist (plannen, materialen, gereedschappen).",
    "3. Rapports Quotidiens": "3. Dagelijkse Rapporten",
    "Chaque jour, le SM rapporte les quantités réellement exécutées, le nombre de travailleurs présents et joint des photos de preuve si nécessaire. En cas de blocage, il catégorise la cause (RCA).": "Elke dag rapporteert de SM de werkelijk uitgevoerde hoeveelheden, het aantal aanwezige werknemers, en voegt indien nodig bewijsfoto's toe. Bij een blokkade categoriseert hij de oorzaak (RCA).",
    "4. Suivi & Analytics": "4. Tracking & Analytics",
    "Le PM et l'Admin suivent la progression en temps réel via les tableaux de bord : productivité par catégorie, EVM, taux d'objectifs atteints et analyses RCA.": "De PM en Admin volgen de voortgang in real-time via dashboards: productiviteit per categorie, EVM, doelrealisatiepercentages en RCA-analyses.",
    "5. Clôture & XP": "5. Afsluiting & XP",
    "La semaine est clôturée automatiquement (ou manuellement par l'Admin). Le système calcule si l'objectif est atteint et attribue l'XP au Chef de Chantier. Le cycle recommence.": "De week wordt automatisch afgesloten (of handmatig door de Admin). Het systeem berekent of het doel is bereikt en kent de XP toe aan de Werfleider. De cyclus begint opnieuw.",
    "ANALYTICS AVANCÉES": "GEAVANCEERDE ANALYTICS",
    "Des données au service de la décision": "Gegevens ten dienste van besluitvorming",
    "Visualisations interactives pour comprendre la performance de vos chantiers en un coup d'œil.": "Interactieve visualisaties om de prestaties van uw werven in één oogopslag te begrijpen.",
    "Analyse de Causes": "Oorzaakanalyse",
    "Heatmap Productivité": "Productiviteitsheatmap",
    "Benchmarking": "Benchmarking",
    "Suivez l'évolution cumulée de vos chantiers avec trois courbes clés :": "Volg de cumulatieve evolutie van uw werven met drie belangrijke curves:",
    "Valeur Planifiée (heures prévues)": "Geplande Waarde (verwachte uren)",
    "Valeur Acquise (heures valorisées)": "Verdiende Waarde (gewaardeerde uren)",
    "Coût Réel (heures brûlées)": "Werkelijke Kosten (verbrande uren)",
    "Analyse des Causes (RCA)": "Oorzaakanalyse (RCA)",
    "Quand un objectif n'est pas atteint, le Chef de Chantier catégorise la cause du retard :": "Wanneer een doel niet wordt bereikt, categoriseert de Werfleider de oorzaak van de vertraging:",
    "Retard Matériel": "Materiaalvertraging",
    "Météo": "Weer",
    "Panne d'Équipement": "Defect Materieel",
    "Main-d'œuvre": "Arbeidskrachten",
    "Erreur de Planification": "Planningsfout",
    "TECHNOLOGIE": "TECHNOLOGIE",
    "Architecture Moderne & Sécurisée": "Moderne & Veilige Architectuur",
    "Construite avec les technologies web les plus performantes pour garantir fiabilité et rapidité.": "Gebouwd met de best presterende webtechnologieën om betrouwbaarheid en snelheid te garanderen.",
    "Framework React full-stack avec rendu côté serveur et optimisation automatique.": "Full-stack React-framework met server-side rendering en automatische optimalisatie.",
    "Base de données relationnelle robuste avec ORM type-safe pour la fiabilité des données.": "Robuuste relationele database met type-safe ORM voor gegevensbetrouwbaarheid.",
    "Contrôle d'accès basé sur les rôles (RBAC) avec tokens sécurisés et validation serveur.": "Role-Based Access Control (RBAC) met veilige tokens en servervalidatie.",
    "Prêt à transformer vos chantiers ?": "Klaar om uw werven te transformeren?",
    "Rejoignez les équipes qui optimisent leur productivité avec EEG GetPlanning.": "Sluit u aan bij de teams die hun productiviteit optimaliseren met EEG GetPlanning.",
    "Accéder à la plateforme →": "Toegang tot platform →",
    "Tous droits réservés": "Alle rechten voorbehouden"
}

for fr, nl in replacements_nl.items():
    content_nl = content_nl.replace(fr, nl)

with open(nl_path, 'w', encoding='utf-8') as f:
    f.write(content_nl)

print("Done generating presentation files.")
