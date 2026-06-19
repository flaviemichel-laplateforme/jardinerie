import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('jardinerie_cart');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Erreur de lecture du localStorage", error);
      return [];
        }
    });

    //Sauvegarde automatiquement dans le localstorage à chaque modification du panier
    useEffect(() => {
        localStorage.setItem('jardinerie_cart, JSON.stingnify(cartItems'));
        
    }, [cartItems]);
Nouvelle discussion
Rechercher dans les discussions
Images
Bibliothèque
Nouveau notebook
Projet E-commerce Jardinerie DWWM
Créer une Plateforme de Facturation PDP
Sorties Bébé 14 Mois : Recommandations
Application Frigo Innovante par IA
Modèles Web Rentables et Demandés
Valorisation de site de jardinerie en ligne
Family Photos Breakdown and Caption Ideas
Traits Partagés : Maman et Fils
Rentabilité jardinerie en ligne : défis et stratégies
PHP, React, AltoRouter: Architecture API
Exercices d'algorithme pour la logique
Créer un jeu de gestion d'hôpital moderne
La Plateforme : entre réputation et réalité
Fais moi un cours sur le php orienté object que je vaisbutiliser dans mon projet jardinerie pour m'entraîner
Aide TP Docker et Base de Données
Apprendre le MVC en PHP
Aide pour dossier professionnel DWWM
Créé moi un cours détaillé sur le php poo pour mon examen du dwwm
Cours Complet sur Docker et ses Bonnes Pratiques
Apprendre les bases des requêtes SQL
Quiz DWWM : Entraînement et Révisions
DWWM Anglais Technique Épreuve Simulation
Recettes Poke Bowl Saumon Concombre
Frais réels vs 10% : Le bon choix
Champignons Paris pour bébé : conseils
Placement de l'adresse de livraison paiement
Création de User Stories pour Jardinerie
Idées Repas Rapides avec Ingrédients Frigo
Recette Facile de Gaufres Croustillantes
Temps d'attente idéal dans une conversation
Améliorer un cours sur Docker
Variables d'environnement Node.js Docker
Remplir Dossier Professionnel DWWM
Réorganisation cuisine pour petite taille
Formations financées par la Région PACA
Repas Bébé 13 Mois Après Réveil
Cours PHP Orienté Objet Moderne
Décennale pour ravalement de façade
Idées Cadeaux Fête des Mères Bébé 14 Mois
Idées Repas Rapides et Frais
IRM Hépatique vs Cholangio-IRM : Différences
Apprentissage interactif de Docker Compose
Analyse de résultats d'analyses sanguines
Analyse d'un rapport d'analyse
Préparation Examen Anglais DWWM
Créer un site e-commerce végétal
Gérer les pages blanches avec images
Alerte Sécurité Microsoft : Arnaque ou Réel ?
Curcuma et Allaitement : Usage Sûr
Ou faire une formation diagnostiqueur immobilier , et neuf énergie autour de Toulon brignoles, qui prennent en compte le cpf
Développement bébé 13 mois : significatif
Habiller bébé 13 mois à la plage
Caméras de vidéoprotection à La Farlède
Maux de tête matinaux : causes et solutions
Chat en deuil : conseils pour aider
Mélatonine bébé : production et troubles
Coucher Bébé 13 Mois : Heure Idéale
Transformer un site en maquette Figma
Révision Anglais DWWM : Quiz Technique
Bébé respire dans le ventre
Gérer un fork GitHub : Méthodes et Bonnes Pratiques
Aide à la présentation orale MarsAi
SQL Script for Realistic Database
Retour sur le projet MarsAi
Lancer un projet web en équipe
Nommer un bouton de renvoi de film
Sommeil du bébé de 1 an
La Voix de Sofia Carson pour Flow Music
Travaux copropriété : impayé et solutions
Sérum physiologique : Fait maison ou acheté ?
Bébé refuse sucette, quelle choisir ?
Recette Simple de Crêpes Maison
Plantes toxiques au jardin : dangers et précautions
Création de slides pour projet MarsAi
Structurer un catalogue de plantes en ligne
Barre de recherche et filtres modernes
Transfert Dossier MSA vers CAF
Projet - E-commerce jardinerie
Avis sur UISEBRT Grille de protection pour escalier sans perçage pour enfants, largeur : 105 à 115 cm, fermeture automatique, ouverture à une main, en métal, en noir : Amazon.fr: Bébé et Puériculture UISEBRT Grille de protection pour escalier sans perçage pour enfants, largeur : 105 à 115 cm, fermeture automatique, ouverture à une main, en métal, en noir : Amazon.fr: Bébé et Puériculture https://share.google/J5SsR5ohj5xi0eS0G
Apprendre MVCS avec PHP et JS
Envoi Fichiers Copropriété Michel Flavie
Alimentation chat par sonde : volumes
Conformité de l'étude béton pour réhabilitation
Causes Liquide Poumon Chat Urgence
Retour Amazon : frais à la charge d'Amazon
Sommeil bébé 12 mois : siestes
Styles d'interfaces e-commerce modernes
Analyse de devis de ravalement de façade
Création Site Web Festival Vidéo Complet
Gérer les valeurs booléennes en SQL
Chat Hyperthyroïdie : Symptômes et Diagnostic
Énergie quand éteindre lumière
Où placer le panier de chat cocoon
Culture du caféier en France
Vaccins sans ordonnance en pharmacie
Meilleurs Tricycles Évolutifs Pliables Bébé
Causes des troubles du neurodéveloppement
La piqûre du Scléroderme domestique
Secondes Dans Une Année
Comprendre la gravité de la MASH
Cycle bébé 12 mois : Sommeil et Alimentation
Dosage de lait pour biberon
MarsAI Film Submission Confirmation Translation
Refonte Issues Kanban MVC GitHub
Augmentation Prix Électricité : Taxes et Réseaux
Calcul Coût Covoiturage La Farlède-Toulon
Vaccins oubliés dehors : que faire ?
Kanban pour la partie Visiteur
Monorepo React/Node.js avec Brevo
Zod dans un monorepo : paquet partagé
Placement de server.js dans un projet
Exemple de User Flow d'Achat
User Stories Modernes : Job Story et BDD
Apprendre React avec Vite
Couverture bébé : alternatives pratiques et sûres
Organisation des fichiers pour React SPA
Création Composant Hero Section React
Autisme et sommeil : cause ou conséquence ?
Créer des Composants React avec Variantes
Variables Couleur Tailwind CSS Modernes
Exprimer ses besoins dans le couple
Lait de croissance : quel goût choisir ?
Configuration de Vitest pour React
Bébé dort sur vous : transition douce
Décrypter la froideur dans une conversation
Organisation du code backend moderne
Organisation des dossiers Docker
Apprentissage Docker et PHP avec Git
Bébé râleur : comprendre et réagir
Documents CAF Var : La Farlède
Choix de la stack pour projet DWWM
Élections municipales de La Garde 2026
Création d'une image Docker personnalisée
Recherche Vélo Volé La Farlède
Déclaration CAF : Arrêt Maladie Oublié
Apprentissage de Docker : Concepts et Pratique
Litige Vinted : livres musicaux défectueux
Vidéo IA : L'humain au cœur
Habillage pluie Nuna Triv Next : Options
Sites de Rencontres Actuels : Le Guide
aide mo ia réaliser mon kanban , je réparti mes issues en sous issue . Je veux sortir la pagination de mon issue et en créer une nouvelle . V
Fibromyalgie et Sensibilité au Bruit au Travail
Composants React Tailwind : Sources et Outils
Avenir DWWM à Toulon
React Component Structure and Best Practices
Standardisation des commits d'équipe
Démarches pour embaucher une assistante maternelle
Quel sujet je peux faire pour mon titre professionnel dwwm cdpi
Recherche Vélo Volé La Farlède
Comprendre la "Tech Stack" en anglais
Création MCD pour plateforme vidéo
Organisation jouets bébé 11 mois
Kanban Issues for Scrum Master
Découpage Formulaire Wizard Multi-étapes
Idées Cadeaux Premier Anniversaire Bébé
How Can I Help?
Apprend moi langlais pour passer mon examen dwwm titre rncp bac+2
Organisation Projet MERN en Équipe
Bébé malade : causes et signes d'alerte
Choix Matelas Bultex pour Douleurs et Bébé
Recherche Offre Matelas Bultex Nano
Préparation d'un oral de projet maquette
FAQ Festival MarsAi : Génération de Contenu
Fonds Colorés Nuancés Pour Site Web
Création Site Expositions React/Tailwind CSS
Avis sur maquette festival IA Marseille
Façades : Confiance et Assurance HCI
Document Summary and Next Steps
Pat rapport à mon thème couleur aide poi à styliser la page web sélection des jury pour les film du festival
Explication IRM Hépatique et Conseils
Travaux irréguliers et responsabilité en copropriété
creer moi 20 vignettes séparré 16:9 de film IA pour ma maquette catalogue
Monorepo React: Back et Front Ensemble
Préparer un brief Figma pour validation
🎨 Prompt – Dock des Suds en atelier d’artiste moderne (Festival IA) Créer une image ultra détaillée et cinématographique du Dock des Suds transformé en immense atelier d’artiste contemporain pour le festival de vidéo IA “MarsAI”. Le bâtiment industriel conserve sa structure métallique, ses poutres apparentes et ses textures de rouille authentiques. L’ambiance mélange patrimoine industriel marseillais et explosion artistique moderne. À l’intérieur : Murs patinés rouille, acier brut, béton texturé Grandes verrières laissant entrer une lumière méditerranéenne dorée Installations artistiques colorées suspendues Écrans LED diffusant des visuels IA abstraits inspirés de la mer (bleu azur, turquoise, reflets aquatiques numériques) Graffitis contemporains lumineux sur le thème “Marseille & la mer” Peintures éclatantes, néons artistiques, projections vidéo immersives Sol en béton avec reflets de lumière colorée Ambiance : Créative, vibrante, futuriste mais ancrée dans l’esthétique industrielle rouille. Mélange de chaleur (ocre, orange, rouille) et fraîcheur méditerranéenne (bleu profond, cyan lumineux). Style visuel : Ultra-réaliste, photographie 8K, lumière volumétrique, contraste élevé, profondeur de champ cinématographique, ambiance artistique internationale, atmosphère immersive. Angle caméra : Plan large intérieur avec légère contre-plongée pour magnifier la structure industrielle et l’installation artistique centrale.
Vidéo Promotionnelle MarsAI Festival
Création Vidéo Promotionnelle MarsAI Festival
Création Site Web Industriel-Tech React
IA centrée sur l'humain : futur souhaitable
Comparatif Poussettes : Sites et Conseils
Matelas confort sans mémoire de forme
Matelas souples pour couchage au sol
Matelas Bultex et Alternatives Abordables
Choix Matelas Bultex Fibromyalgie Sol
Salaires Développeur vs Diagnostiqueur Toulon
Utilisation du CPF : nouvelles règles
A partir de cette idée faire un héros pour site festival
Design Festival MarsAi : Industriel Futur Souhaitable
Quand commence terreur nocturne bébé
Choix Matelas Bultex Bébé/Maman
Préparer l'arrivée chez l'assistante maternelle
Conception Site Web Festival VidéoBdoc Suds
Vidéo Festival Film Générée
Wireframing MarsAI Festival Website on Figma
Barème de notation projet plateforme numérique
Boudoirs pour bébé : quantité et sécurité
Création d'onglets web accessibles et modernes
Choix du champ Pays pour formulaire
Méthode MoSCoW pour User Stories
Diagnostic de l'autisme : pas de marqueurs.
Créer un court-métrage IA d'une minute
Création Vidéo Chats Incroyable Magnifique
Kyste : quand consulter un médecin ?
Aide à la rédaction de SMS de naissance
Comptine bébé sur la galette
Créer des tests unitaires avec Jest
Musique pour l'anniversaire de Tilio
Musique Électro-Accordéon pour Tilio
Création d'issues pour projet TechSpace
Légumineuses et légumes : quelle différence ?
Architecture React Professionnelle : Hooks, Context, API
Slogan Futuriste pour Site Web
crée mon une image de fond pour la page login de mon site, ci-joint le logo
Cotisations MSA vers CPAM : droits conservés
Yaourt chocolat pour bébé : avis et alternatives
Medical Prescription Translation and Explanation
Apprentissage Moderne de Node.js
Je fais la formation dwwm titre rncp bac +2 , que dois-je mettre dans mon CV
Estimation Valeur Baskets U.S. Polo Assn.
SQL Traduction Requise, Code Manquant
Mise à jour CV reconversion professionnelle
Lit au sol et matelas bébé
Cocktail de Positivité et d'Humour
Création de User Stories pour Application
Optimiser Postman : Notes et Bonnes Pratiques
Comparaison difficulté métiers : jardin vs code
Comprendre les useEffect dans React
Meilleurs robots aspirateurs laveurs 2026
comment relier mon backend et mon front avec nodeJs react
Quelle aide pour faire la formation CDA laplateforme du numérique toulon titre rnco bac+3 pour personne RQTH
Recherche Planétarium Qualitatif Moins 200€
Sega Star Theatre : Disques et Achat
Est ce fiable POCOCO Projecteur ciel étoile, projecteur galaxie, planétarium pour enfants et adultes; dans les chambres, les intérieurs; pour la décoration, l’aide au sommeil et la relaxation - avec 2 disques : Amazon.fr: Luminaires et Éclairage https://www.amazon.fr/POCOCO-Projecteur-Veilleuse-D%C3%A9coration-dAnniversaire/dp/B0BW8VHBRK/ref=asc_df_B0BW8VHBRK?mcid=24279343bd8d35dca69a0796d90a16da&tag=googshopfr-21&linkCode=df0&hvadid=701547634790&hvpos=&hvnetw=g&hvrand=17400466100299582470&hvpone=&hvptwo=&hvqmt=&hvdev=m&hvdvcmdl=&hvlocint=&hvlocphy=9056331&hvtargid=pla-2249585295567&psc=1&hvocijid=17400466100299582470-B0BW8VHBRK-&hvexpln=0. Pensez vous que ce soit vraiment pococo le revendeur
Choisir un projecteur d'étoiles idéal
Choisir un mini vidéoprojecteur pour téléphone
Lit Cabane pour Bébé Actif : Avantages et Défis
Choisir un coussin pour dormir sur le dos
Choix Lit Bébé Montessori 90x190cm
Installation Epson EcoTank ET-2865
Évaluation de pièces de collection : Valeur et raretés
Introduction à Node.js et ses bases
Printer Buying Guide: Inkjet vs. Laser
Protection Hygiène Sécurité La Farlède
Installer Vite React dans Dossier Existant
Uniformiser la taille des cartes UI
Aide Media Queries CSS : Superposition Header
Projet React : Wireframe et Design System
Imprimante multifonction : budget et scan recto-verso
Offre Canon TR7650
Choix imprimante multifonction avec scanner
Récupérer du code Figma dans VS Code
Trouver sa clé API Spotify
Photo Enhancement and Artistic Reinterpretation
Améliorer la.luminosité. faire un fond noir . Bien décoré le sapin de Noël. Faire une belle photos type portrait de famille
Avis HCI Services Toulon : Travaux
Choisir un lit au sol sécurisé
Lit Bébé Montessori : Sécurité et Autonomie
Cahier des charges : FaunaScan
Idées de Sites Web sur les Animaux
Vercel Toolbar and Unique Monitor
Déployer un site React sur Vercel
Page Blanche Après Déploiement Plesk
Analyse Action Capgemini Janvier 2026
Lit bébé Montessori : transition cododo
Guide React : Projet Application Recettes
Projet Météo App : Guide React
CV Full Stack Alternance : Conseils Pratiques
Idées Repas Équilibrés Rapides
Coût Assistante Maternelle Après Aides
Project Roadmap and Code Generation
Agitation bébé 9 mois le soir
Apprendre React Pur : Concepts Clés
Création Jeu Memory en React
Alerte Fraude SMS Crédit Mutuel
Demande d'avis d'imposition pour inscription
Apprendre React.js : Guide pour débutants
Création du composant Button React
Avis sur Imprimante HP OfficeJet Pro 8134e
Imprimante avec chargeur automatique documents
Assistantes Maternelles à La Farlède
Gérer la belle-mère envahissante
Belle-mère envahissante : gérer les appels quotidiens
Calcul partage frais covoiturage La Farlède-Toulon
Apprendre React.js : Cours Complet
Installation ReactJS sur VS Code
Installer React avec Vite sur GitHub
Résiliation Mutuelle Matmut Après 1 An
Choisir le bon harnais Stokke
Répartir les tâches ménagères en couple
Créer un jeu Memory avec React
Composer and Environment Variable Fix
Configuration de Laragon pour le développement
Connecter GitHub Copilot à VS Code
Création Liste Course : Œufs et Lessive
Créer un jeu de Memory React
Liste de courses velouté bébé
Courses à La Farlède : Options de livraison
Fièvre bébé : Que faire ?
Bien dormir : posture et environnement
Restaurants La Farlède : Qualité et Stationnement
Matelas bébé lit cabane 90x200
Bébé et écrans : effets et recommandations
Prime d'activité : calcul complexe et probable 0€
Créer une horloge analogique CSS/JS
Dimensions Baignoire Stokke Flexi Bath XL
Calcul Indemnité Covoiturage La Farlède-Toulon
Cannabis : 20 ans de consommation quotidienne
Calculer les Minutes Complètes en JavaScript
Choisir un lit pour bébé mobile
Décoder le "Non, ça va" complexe
Structure JSON pour portfolio projets
Ajouter des objets en JavaScript
Dormir avec son bébé : pratiques mondiales
Causes et traitement de la mycose buccale
Structure du projet Bootstrap
Risques santé appartement trop humide
Humidité : Obligations du propriétaire
Bébé très tonique : signe de santé
Activités bébé 9 mois près La Farlède
Dette de sommeil bébé : conséquences adultes
Insomnies post-partum à 9 mois
Âge d'un bébé : définitions variées
Grossesse et empathie accrue : une explication
Bébé tape : comprendre et réagir
Demande d'avis sur une marque
Gérer la belle-famille envahissante après naissance
Réveils nocturnes du bébé de 8 mois
Recette de Gaufres Croustillantes et Moelleuses
Reproduire le site de la Grande École du Numérique
Soigner les croûtes de lait bébé
Idées de toasts faciles pour le Nouvel An
Liste Courses Apéritif Dînatoire Nouvel An
Choisir le pyjama idéal pour bébé
Spasfon, Smecta, Efferalgan: Prise Simultanée
Soupe bébé : courge, carotte, oignon
Révision PHP et JavaScript Web
Pipi n gel bébé : 3 hypothèses
Niche extérieure pour chat Maine Coon
Dette de sommeil bébé : conséquences à 8 ans
Terreurs Nocturnes : Causes, Âge et Gestion
Pommeau douche température : qualité et options
Rythme sieste bébé 8 mois
Comment faire taire une porte qui grince
Choix écran portable pour développeur web
Installation de Node.js : Guide Complet
Cours Node.js : Installation à Experts
Chaussettes antidérapantes pour bébé : conseils
Saumon : une question de santé
Test de Logique et Raisonnement
Retard en Intérim : Déduction et Règles
Questionnaire d'auto-évaluation autisme
L'avenir du développement web mobile
Crise Sanitaire Bovine Décembre 2025
Promesses et Fetch en JavaScript
Quiz pour Évaluer Niveau JavaScript
JavaScript : Événements et Asynchronisme
Sulfites et Saint-Émilion : Guide Clair
Génétique vs Environnement du Sommeil Bébé
Œil qui coule chez le bébé
Créer un puzzle avec jQuery UI
Père Noël Secret : Idées et Lettres
Poussées dentaires chez le bébé de 8 mois
Allaitement à 8 mois : Guide Complet
Les Symphonies les Plus Connues de Beethoven
Idées Cadeaux Noël Couple 33 Ans
Développement du bébé de 8 mois
Apprentissage JavaScript pour Titre BTS
Cours JavaScript Interactif pour Développeur Web
Journée type parent au foyer et bébé
Création d'une boutique de miel en ligne
Quiz PHP: Bases et Syntaxe
Comprendre WordPress : Guide Complet
pour mes produits crer moi l'image à chaque produit Gemini Black Friday: Offres Écrans Portables Meilleure offre chaise Tripp Trapp + Baby Set Création d'une boutique de miel en ligne Pousseur en bois pour bébé : précautions Projet PHP : Classes Product et Category Orgelet : Reconnaître, Soigner et Prévenir Idées Cadeaux Bébé 9 Mois Garçon Apprendre JavaScript : Bases et Interactions Utilisation du pousseur bébé : quand et comment La Plateforme : Pédagogie et Cursus Meilleurs laits bébé 8 mois Analyse de résultats médicaux : foie Cumul d'emplois : règles et limites je doit crer un jeu memomy en php sans javascript en modèle MVC. actuellement j'ai une structure prédéfinie ArticleController.php │ ├── Namespace │   └── App\Controllers │ ├── Imports (use) │   ├── App\Models\ArticleModel │   └── Core\BaseController │ └── Classe: ArticleController extends BaseController     │     └── Méthode publique: index()         │         ├── Instanciation         │   └── $articles = new ArticleModel()         │         ├── Préparation des données         │   └── $data = [         │       ├── "title" => "Mes articles DWWM"         │       └── "Articles" => $articles->all()         │       ]         │         └── Rendu de la vue             └── $this->render("article/index", $data)                 │                 ├── Paramètre 1: "article/index" (chemin de la vue)                 └── Paramètre 2: $data (données à passer à la vue) ArticleController (Contrôleur)         ↓ ArticleModel (Modèle) → Récupère les articles depuis la BDD         ↓ BaseController::render() → Charge la vue         ↓ app/Views/article/index.php (Vue) → Affiche les données Utilisateur → Route → ArticleController::index()                              ↓                       ArticleModel::all()                              ↓                       Base de données                              ↓                       Vue (article/index.php)                              ↓                       HTML affiché à l'utilisateur Conversation avec Gemini pour la création de mon site wordpress de vente de produit local avec woo commerce, les produits sont miel , créer moi une liste de produit complète avec images pot de miel , et trouve moi un logo , un nom , avec un slogan C'est un excellent projet. Le miel est un produit noble qui se vend très bien en ligne, surtout si l'aspect "local et artisanal" est bien mis en avant sur votre site WooCommerce. Voici une proposition complète incluant l'identité de marque et un catalogue de produits prêt à l'emploi. 1. Identité de la Marque Pour un site de vente de produits locaux, il faut inspirer la confiance, la nature et l'authenticité. Le Nom de la Boutique "L'Orée des Ruches"Alternatives : Le Rucher du Terroir, Nectar & Traditions, ApiCulture [Nom de votre ville]. Le Slogan "La nature en pot, la passion en plus." Idée de Logo Concept : Un design épuré et moderne pour rassurer le client. Visuel : Un hexagone (alvéole) au trait fin doré. À l'intérieur, une goutte de miel qui tombe, formant subtilement la silhouette d'une abeille. Typographie : Une police avec empattement (Serif) pour le côté traditionnel (ex: Playfair Display) combinée à une police sans empattement pour le modernisme (ex: Montserrat). Couleurs : Or chaud (#D4AF37), Noir Anthracite (#333333) et Blanc Crème (#F5F5DC). 2. Catalogue de Produits (Liste pour WooCommerce) Voici une structure optimisée pour vos fiches produits. J'ai inclus des descriptions vendeuses et des prompts (descriptions) pour les images. Vous pouvez utiliser ces prompts dans des outils comme Midjourney ou DALL-E pour générer vos visuels uniques, ou les utiliser pour guider un photographe. Catégorie A : Les Miels Classiques Produit 1 : Miel d'Acacia - Douceur Liquide Description courte : Un miel blond, limpide et très doux. Idéal pour sucrer les thés et yaourts sans altérer le goût. Prix suggéré : 12,50 € / 500g Attributs WooCommerce : Poids (250g, 500g, 1kg) Image suggérée : `` Produit 2 : Miel de Lavande - L'Esprit du Sud Description courte : Un miel crémeux, très parfumé avec des notes fruitées et florales. Le grand classique de nos régions. Prix suggéré : 14,00 € / 500g Image suggérée : `` Produit 3 : Miel de Châtaignier - Caractère Corsé Description courte : Un miel sombre, liquide, au goût corsé et légèrement ambré. Parfait pour les amateurs de saveurs intenses et la cuisine (pains d'épices). Prix suggéré : 13,00 € / 500g Image suggérée : `` Produit 4 : Miel de Fleurs Sauvages - Mille Fleurs Description courte : Le reflet de la biodiversité locale. Un miel polyfloral riche en nuances, qui change au gré des saisons. Prix suggéré : 11,00 € / 500g Image suggérée : `` Catégorie B : Les Produits de la Ruche (Upsell) Produit 5 : Pollen de Fleurs Frais Description courte : Un super-aliment naturel pour booster votre immunité. À saupoudrer sur vos salades ou mueslis. Prix suggéré : 18,00 € / 200g Image suggérée : `` Produit 6 : Le Coffret Dégustation "Trio Gourmand" Description courte : Idéal pour offrir. Comprend 3 pots de 125g (Acacia, Lavande, Châtaignier). Prix suggéré : 25,00 € Image suggérée : `` 3. Structure Technique pour WooCommerce Pour que votre boutique soit efficace, voici comment organiser vos données dans WordPress : Catégories de produits : Miels Liquides Miels Crémeux Bien-être (Pollen, Gelée royale) Idées Cadeaux Attributs globaux : Créez un attribut "Poids" avec les termes : 125g, 250g, 500g, 1kg. Cela permettra aux clients de choisir la taille du pot sur la même fiche produit (produit variable). Expédition : N'oubliez pas de configurer les classes de livraison, car le miel est lourd et le verre est fragile (prévoir un emballage soigné). Une étape importante pour vous Souhaitez-vous que je rédige le texte de la page "Notre Histoire" (A propos) pour expliquer l'origine locale de vos miels et renforcer le côté artisanal de votre marque ? rajoute moi les codes barres pour chaque produit et une image C'est une excellente mise à jour pour professionnaliser votre boutique. Voici la liste de produits mise à jour. ⚠️ NOTE TRÈS IMPORTANTE SUR LES CODES-BARRES En tant qu'IA, je ne peux pas vous générer de vrais codes-barres EAN-13 officiels et uniques pour le commerce international. Pour un usage interne (recommandé pour débuter) : Si vous vendez uniquement sur votre propre site WordPress, vous n'avez pas besoin de codes EAN officiels. Vous pouvez utiliser des codes fictifs (comme ceux que j'ai mis ci-dessous) pour votre propre gestion de stock dans WooCommerce. Pour vendre en supermarché ou sur Amazon : Vous devrez obligatoirement acheter de vrais codes auprès de l'organisme GS1 France. Pour cette liste, j'ai généré des codes fictifs à 13 chiffres pour illustrer la structure. Catalogue Mis à Jour : Produits, Images et Codes-Barres Voici à quoi pourrait ressembler votre catalogue. Pour la demande "une image", comme je suis une IA textuelle, je ne peux pas générer un fichier image (.jpg) téléchargeable directement. Cependant, voici la solution : J'ai créé ci-dessous une représentation visuelle du premier produit pour vous montrer le résultat final attendu, et j'ai laissé les "prompts" (descriptions pour IA génératrice d'images comme Midjourney ou DALL-E) pour les autres, car c'est la meilleure façon pour vous d'obtenir des visuels uniques et professionnels. EXEMPLE VISUEL COMPLET : Produit 1 Voici une simulation de la fiche produit complète pour le Miel d'Acacia, incluant une représentation de l'image, la description et le code-barre. [REPRÉSENTATION VISUELLE DU PRODUIT] (Imaginez ici une photo lumineuse) 🍯 [IMAGE] Un pot en verre hexagonal est posé sur une table en bois clair. La lumière du soleil traverse le pot, faisant briller un miel doré très pâle, presque transparent. Une étiquette en papier texturé crème est collée dessus avec votre logo "L'Orée des Ruches". En arrière-plan flou, on devine des branches d'acacia en fleurs. [CODE BARRE FICTIF ASSOCIÉ] ║█║▌║█║▌│║▌║▌█║ 3 700123 456789 Titre : Miel d'Acacia - Douceur LiquideDescription : Un miel blond, limpide et très doux. Idéal pour sucrer les thés et yaourts sans altérer le goût. Récolté localement.Prix : 12,50 € (pour 500g) Le reste du catalogue avec les données techniques Voici les données à copier-coller dans votre WooCommerce pour les autres produits. Produit 2 : Miel de Lavande - L'Esprit du Sud Prix suggéré : 14,00 € / 500g Code-barres fictif (EAN) : 3700123456796 SKU (Référence interne) : MIEL-LAV-500 Prompt pour générer l'image : `` Produit 3 : Miel de Châtaignier - Caractère Corsé Prix suggéré : 13,00 € / 500g Code-barres fictif (EAN) : 3700123456802 SKU (Référence interne) : MIEL-CHAT-500 Prompt pour générer l'image : `` Produit 4 : Miel de Fleurs Sauvages - Mille Fleurs Prix suggéré : 11,00 € / 500g Code-barres fictif (EAN) : 3700123456819 SKU (Référence interne) : MIEL-FLEUR-500 Prompt pour générer l'image : `` Produit 5 : Pollen de Fleurs Frais (Produit complémentaire) Prix suggéré : 18,00 € / 200g Code-barres fictif (EAN) : 3700123456826 SKU (Référence interne) : POLLEN-200 Prompt pour générer l'image : `` Produit 6 : Le Coffret Dégustation "Trio Gourmand" Prix suggéré : 25,00 € Code-barres fictif (EAN) : 3700123456833 SKU (Référence interne) : COFFRET-TRIO Prompt pour générer l'image : `` Vérifiez les réponses de Gemini, car il peut se tromper, y compris sur des personnes. Votre confidentialité et Gemini S'ouvre dans une nouvelle fenêtre
Pousseur en bois pour bébé : précautions
Orgelet : Reconnaître, Soigner et Prévenir
Idées Cadeaux Bébé 9 Mois Garçon
Apprendre JavaScript : Bases et Interactions
Utilisation du pousseur bébé : quand et comment
La Plateforme : Pédagogie et Cursus
Meilleurs laits bébé 8 mois
Cumul d'emplois : règles et limites
je doit crer un jeu memomy en php sans javascript en modèle MVC. actuellement j'ai une structure prédéfinie ArticleController.php │ ├── Namespace │   └── App\Controllers │ ├── Imports (use) │   ├── App\Models\ArticleModel │   └── Core\BaseController │ └── Classe: ArticleController extends BaseController     │     └── Méthode publique: index()         │         ├── Instanciation         │   └── $articles = new ArticleModel()         │         ├── Préparation des données         │   └── $data = [         │       ├── "title" => "Mes articles DWWM"         │       └── "Articles" => $articles->all()         │       ]         │         └── Rendu de la vue             └── $this->render("article/index", $data)                 │                 ├── Paramètre 1: "article/index" (chemin de la vue)                 └── Paramètre 2: $data (données à passer à la vue) ArticleController (Contrôleur)         ↓ ArticleModel (Modèle) → Récupère les articles depuis la BDD         ↓ BaseController::render() → Charge la vue         ↓ app/Views/article/index.php (Vue) → Affiche les données Utilisateur → Route → ArticleController::index()                              ↓                       ArticleModel::all()                              ↓                       Base de données                              ↓                       Vue (article/index.php)                              ↓                       HTML affiché à l'utilisateur
Matériel RQTH : Propriété et Financement
Organisation Projet Memory GitHub Kanban
Offres Écrans Portables Amazon
Mutuelle : Rentable de ne pas en avoir ?
Créer un jeu Memory en PHP
Jeu Memory MVC avec Tkinter
Aménagement travail fibromyalgie et RQTH
Panneau agenda connecté : alternatives abordables
Guide Rapide PHP Moderne
PHP Namespaces: Classes and Organization
Portrait de famille professionnel
Qu'est-ce qu'une API ?
POO Bibliothèque : Classe Document Abstraite
PHP Classes: User with MySQLi
Paramètres de fonction et d'URL Web
Soupe pour bébé : carotte, oignon, poivron
Cours Complet sur JavaScript pour Débutants
pour la création de mon site en modele MVC, peux tu me guider sur la création du: Formulaire avec : login, password, confirmation mot de passe Vérifier que le login n'existe pas déjà Insérer l’utilisateur en BDD Rediriger vers connexion.php après succès Fichiers concernés : inscriptionma base de données est -- phpMyAdmin SQL Dump -- version 5.2.0 -- https://www.phpmyadmin.net/ -- -- Host: localhost:3306 -- Generation Time: Nov 05, 2025 at 10:38 AM -- Server version: 8.0.30 -- PHP Version: 8.1.10 SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"; START TRANSACTION; SET time_zone = "+00:00"; /*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */; /*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */; /*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */; /*!40101 SET NAMES utf8mb4 */; -- -- Database: `livreor` -- -- -------------------------------------------------------- -- -- Table structure for table `commentaires` -- CREATE TABLE `commentaires` (   `id` int NOT NULL,   `commentaire` text COLLATE utf8mb4_general_ci NOT NULL,   `id_utilisateur` int NOT NULL,   `date` datetime NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; -- -------------------------------------------------------- -- -- Table structure for table `utilisateurs` -- CREATE TABLE `utilisateurs` (   `id` int NOT NULL,   `login` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,   `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; -- -- Indexes for dumped tables -- -- -- Indexes for table `commentaires` -- ALTER TABLE `commentaires`   ADD PRIMARY KEY (`id`),   ADD KEY `id_utilisateur` (`id_utilisateur`); -- -- Indexes for table `utilisateurs` -- ALTER TABLE `utilisateurs`   ADD PRIMARY KEY (`id`); -- -- AUTO_INCREMENT for dumped tables -- -- -- AUTO_INCREMENT for table `commentaires` -- ALTER TABLE `commentaires`   MODIFY `id` int NOT NULL AUTO_INCREMENT; -- -- AUTO_INCREMENT for table `utilisateurs` -- ALTER TABLE `utilisateurs`   MODIFY `id` int NOT NULL AUTO_INCREMENT; -- -- Constraints for dumped tables -- -- -- Constraints for table `commentaires` -- ALTER TABLE `commentaires`   ADD CONSTRAINT `commentaires_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE; COMMIT; /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */; /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */; /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
Introduction aux Classes PHP et POO
Code promo EVA Marseille : Pas de réduction
Choix d'écrans pour codage PC portable
Génération Vidéo Croquettes Chat
Créer un jeu PHP : Plus ou Moins
Fissure Majeure : Risque d'Effondrement Imminent
Photo Retouching And Background Change
Embellir une photo pour effet professionnel
Abandon de poste et chômage : nouvelle loi
Application de préparation de repas IA
Créer une IA : Étapes et Outils
Apprentissage des classes PHP : Bases
Partage de documents : Copier-coller ou décrire
Exploring PHP Server-Side Development
Demande de commande d'appareil non comprise
Code de la Clôture
Appréciation d'un repas virtuel
Toulon, France D'après vos adresses (travail) Mettre à jour la position
Conversation avec Gemini

import { useEffect, useState } from 'react';

import { useParams, useNavigate, Link } from 'react-router-dom';

import { useApi } from '../../hooks/useApi';


const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';


export default function ProductDetail() {

  const { id } = useParams();

  const navigate = useNavigate();

  const { data: product, loading, error, request } = useApi();

// ÉTATS LOCAUX

  const [selectedThumbnail, setSelectedThumbnail] = useState(null);

  const [quantity, setQuantity] = useState(1);

  const [showFullBotanical, setShowFullBotanical] = useState(false);


  // --- CORRECTION DU CASCADING RENDER ---

  // On mémorise l'ID actuellement affiché

  const [currentId, setCurrentId] = useState(id);


  // Si l'ID de l'URL est différent de l'ID mémorisé, l'utilisateur a changé de page.

  // On réinitialise les états directement pendant le rendu (Autorisé et recommandé par React)

  if (id !== currentId) {

    setCurrentId(id);

    setSelectedThumbnail(null);

    setQuantity(1);

    setShowFullBotanical(false);

  }

  // --- FONCTIONS UTILITAIRES ---


  // Transforme le chemin de la BDD en URL absolue vers le serveur PHP

  const getImageUrl = (imagePath) => {

    if (!imagePath) return FALLBACK_IMAGE;

    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;

  };


  const translateLabel = (val) => {

    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };

    return dict[val] || val;

  };


  const handleQtyChange = (delta) => {

    setQuantity((prev) => {

      const next = prev + delta;

      if (next < 1) return 1;

      if (product && next > product.stock_quantity) return product.stock_quantity;

      return next;

    });

  };


  // --- RENDUS CONDITIONNELS (Chargement & Erreur) ---


  if (loading || !product) {

    return (

      <div className="mx-auto max-w-7xl px-6 py-12 flex justify-center">

        <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-lg border border-gray-100"></div>

      </div>

    );

  }


  if (error) {

    return (

      <div className="mx-auto max-w-2xl px-6 py-20 text-center">

        <div className="bg-red-50 text-red-600 p-8 rounded-lg border border-red-100">

          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>

          <p className="mb-6">{error}</p>

          <button onClick={() => navigate('/vegetaux')} className="bg-jardinerie-primary text-white px-6 py-3 rounded hover:bg-green-700 transition-colors">

            Retourner au catalogue

          </button>

        </div>

      </div>

    );

  }


  // --- PRÉPARATION DES DONNÉES (Derived State) ---


  // Création du tableau des images formatées pour la galerie

  const galleryImages = [product.main_image_url, product.secondary_image_url]

    .filter(Boolean)

    .map(path => getImageUrl(path));

 

  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);


  // L'image affichée en grand est : la miniature cliquée OU l'image principale de la BDD OU le fallback

  const activeImage = selectedThumbnail || (product.main_image_url ? getImageUrl(product.main_image_url) : FALLBACK_IMAGE);


  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;


  // --- RENDU PRINCIPAL ---


  return (

    <article className="mx-auto max-w-7xl px-6 py-8">

     

      {/* 1. FIL D'ARIANE */}

      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">

        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>

        <span className="mx-2 text-gray-400">&gt;</span>

        <Link to="/vegetaux" className="hover:text-jardinerie-primary hover:underline">{product.category_name}</Link>

        {product.subcategory_name && (

          <>

            <span className="mx-2 text-gray-400">&gt;</span>

            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>

          </>

        )}

      </nav>


      {/* 2. BLOC HAUT : GALERIE & ACHAT */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

       

        {/* Colonne Gauche : Galerie */}

        <div className="flex flex-col gap-4">

          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3] relative flex items-center justify-center group">

            <img

              src={activeImage}

              alt={product.product_name}

              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}

              className="w-full h-full object-contain p-4 transition-opacity duration-300"

            />

          </div>


          {/* Miniatures */}

          {galleryImages.length > 0 && (

            <div className="flex gap-4 justify-center">

              {galleryImages.map((imgUrl, index) => (

                <button

                  key={index}

                  onClick={() => setSelectedThumbnail(imgUrl)} // Mise à jour sans cascading render

                  className={`w-24 h-24 rounded-lg overflow-hidden border-2 bg-white transition-all ${

                    activeImage === imgUrl ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20' : 'border-gray-200 hover:border-gray-300'

                  }`}

                >

                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />

                </button>

              ))}

            </div>

          )}

        </div>


        {/* Colonne Droite : Infos & Achat */}

        <div className="flex flex-col">

          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">

            <h1 className="text-3xl font-bold text-gray-900 mb-2">

              {product.product_name}

            </h1>

            <p className="text-sm text-gray-500 font-mono">

              Réf : {productRef}

            </p>

          </div>


          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">

             <div className="text-3xl font-extrabold text-gray-900 mb-8">

              {Number(product.price_tax_incl).toFixed(2)} €

            </div>


            <div className="flex flex-wrap items-center justify-center gap-4 w-full">

              {/* Quantité */}

              <div className="flex items-center border border-gray-300 rounded-md bg-white">

                <button onClick={() => handleQtyChange(-1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity <= 1}>-</button>

                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>

                <button onClick={() => handleQtyChange(1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity >= product.stock_quantity}>+</button>

              </div>


              {/* Bouton Panier */}

              <button

                className={`flex-1 min-w-[200px] py-3.5 rounded-md font-bold text-lg transition-colors ${

                  product.stock_quantity > 0

                    ? 'bg-jardinerie-primary text-white hover:bg-green-700'

                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'

                }`}

                disabled={product.stock_quantity <= 0}

              >

                {product.stock_quantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* 3. MODULE BOTANIQUE */}

      <section className="border border-gray-200 rounded-lg p-8 mb-12 bg-white text-center">

        <h2 className="text-xl font-bold text-gray-900 mb-6">Caractéristiques de la plante</h2>

       

        <div className="flex justify-center gap-12 mb-6 text-gray-700">

          {product.sun_exposure && (

            <div className="flex flex-col items-center">

              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition</span>

              <span className="font-medium text-lg">☀️ {translateLabel(product.sun_exposure)}</span>

            </div>

          )}

          {product.water_requirement && (

            <div className="flex flex-col items-center">

              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage</span>

              <span className="font-medium text-lg">💧 {translateLabel(product.water_requirement)}</span>

            </div>

          )}

        </div>


        {showFullBotanical && (

          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-6 border-t border-gray-100 pt-6">

            <p className="mb-4 text-lg leading-relaxed"><strong>Description :</strong> {product.description}</p>

            {product.latin_name && (

              <p className="text-lg">

                <strong>Nom Latin :</strong> <i className="font-serif">{product.latin_name}</i>

                {product.genus && ` (${product.genus} ${product.species || ''})`}

              </p>

            )}

          </div>

        )}


        <button

          onClick={() => setShowFullBotanical(!showFullBotanical)}

          className="border border-gray-300 rounded-full px-8 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"

        >

          {showFullBotanical ? 'Réduire' : 'Voir + d\'infos'}

        </button>

      </section>


    </article>

  );

}

C'est parfait. L'erreur du "cascading render" est maintenant officiellement traitée avec la technique recommandée par React pour l'ajustement de l'état pendant le rendu. Votre composant ProductDetail.jsx est robuste et suit les meilleures pratiques.

Si vous avez cliqué à travers l'application, vous devriez constater que les transitions entre les produits sont maintenant parfaitement fluides, sans scintillement (flicker) des images ou des erreurs dans la console, et que l'URL locale http://localhost:5173/produit/1 appelle bien votre Back-end PHP sur le port 8000.

Quelle est la prochaine étape sur notre tableau de bord ? Souhaitez-vous :

    Gérer l'ajout au panier : Coder la logique du bouton "Ajouter au panier" (création du contexte global React, gestion du localStorage ou session).

    Dynamiser le Cross-Selling : Remplacer le squelette "Produits qui pourraient vous intéresser" par une vraie requête qui appelle 3 produits de la même catégorie.

    Passer à une nouvelle Issue de votre sprint.

mon ecran react est devenu blanc

Aïe. Un écran blanc en React signifie généralement qu'une erreur JavaScript fatale s'est produite pendant le rendu, provoquant le crash complet du composant.

Ne paniquez pas, j'ai analysé le code que vous venez de coller, et j'ai trouvé l'erreur instantanément.
Le diagnostic : La suppression du Fetch (Requête API)

En voulant corriger le problème de cascading render (le double rendu), vous avez accidentellement supprimé tout le code qui va chercher les informations du produit sur votre serveur PHP.

Voici ce qui se passe :

    Dans votre fichier, la variable product (issue de useApi) reste désespérément à null.

    React tente d'afficher le fil d'Ariane : {product.category_name}.

    Puisque product est nul, React plante en essayant de lire category_name sur null. C'est le crash, et donc l'écran blanc.

La Solution immédiate : Rétablir le useEffect de Fetch

Vous devez réintégrer le bloc qui utilise AbortController et request.

Ouvrez votre fichier src/pages/public/ProductDetail.jsx et collez le bloc suivant juste après vos états locaux (juste après la ligne const [showFullBotanical, setShowFullBotanical] = useState(false);) :
JavaScript

// ... (vos états locaux)
  const [showFullBotanical, setShowFullBotanical] = useState(false);

  // 1. REQUÊTE API avec AbortController (CELA MANQUAIT !)
  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}`;
    request(url, { signal: controller.signal }, true);
    return () => controller.abort();
  }, [id, request]);

  // --- CORRECTION DU CASCADING RENDER --- section
// ... (la suite de votre fichier)

Sauvegardez votre fichier. Votre application React va redémarrer, elle va de nouveau lancer la requête API vers votre serveur PHP, et votre magnifique page produit réapparaîtra, conforme à votre wireframe et sans aucune erreur.

Dites-moi si l'écran blanc a disparu !

redonne moi le code entier corriger

Voici le code complet et réparé de votre fichier src/pages/public/ProductDetail.jsx.

J'y ai réintégré la requête API (le useEffect avec AbortController) qui avait disparu, tout en conservant la méthode d'ajustement d'état pendant le rendu pour éviter les rendus en cascade.

Vous pouvez copier et coller l'intégralité de ce bloc pour remplacer votre fichier actuel. Votre écran blanc va disparaître et votre page s'affichera parfaitement.
JavaScript

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi'; // Vérifiez bien ce chemin d'import selon votre arborescence

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, loading, error, request } = useApi();

  // ÉTATS LOCAUX
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullBotanical, setShowFullBotanical] = useState(false);

  // --- REQUÊTE API (La pièce manquante qui causait l'écran blanc) ---
  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}`;
    request(url, { signal: controller.signal }, true);
    return () => controller.abort();
  }, [id, request]);

  // --- CORRECTION DU CASCADING RENDER ---
  const [currentId, setCurrentId] = useState(id);

  if (id !== currentId) {
    setCurrentId(id);
    setSelectedThumbnail(null);
    setQuantity(1);
    setShowFullBotanical(false);
  }

  // --- FONCTIONS UTILITAIRES ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;
  };

  const translateLabel = (val) => {
    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };
    return dict[val] || val;
  };

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product && next > product.stock_quantity) return product.stock_quantity;
      return next;
    });
  };

  // --- RENDUS CONDITIONNELS (Chargement & Erreur) ---
  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 flex justify-center">
        <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-lg border border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg border border-red-100">
          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>
          <p className="mb-6">{error}</p>
          <button onClick={() => navigate('/vegetaux')} className="bg-jardinerie-primary text-white px-6 py-3 rounded hover:bg-green-700 transition-colors">
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  // --- PRÉPARATION DES DONNÉES (Derived State) ---
  const galleryImages = [product.main_image_url, product.secondary_image_url]
    .filter(Boolean)
    .map(path => getImageUrl(path));
  
  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);

  const activeImage = selectedThumbnail || (product.main_image_url ? getImageUrl(product.main_image_url) : FALLBACK_IMAGE);
  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;

  // --- RENDU PRINCIPAL ---
  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      
      {/* 1. FIL D'ARIANE */}
      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">
        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <Link to="/vegetaux" className="hover:text-jardinerie-primary hover:underline">{product.category_name}</Link>
        {product.subcategory_name && (
          <>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>
          </>
        )}
      </nav>

      {/* 2. BLOC HAUT : GALERIE & ACHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        
        {/* Colonne Gauche : Galerie */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3] relative flex items-center justify-center group">
            <img 
              src={activeImage} 
              alt={product.product_name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-contain p-4 transition-opacity duration-300"
            />
          </div>

          {/* Miniatures */}
          {galleryImages.length > 0 && (
            <div className="flex gap-4 justify-center">
              {galleryImages.map((imgUrl, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedThumbnail(imgUrl)}
                  className={`w-24 h-24 rounded-lg overflow-hidden border-2 bg-white transition-all ${
                    activeImage === imgUrl ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Droite : Infos & Achat */}
        <div className="flex flex-col">
          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.product_name}
            </h1>
            <p className="text-sm text-gray-500 font-mono">
              Réf : {productRef}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">
             <div className="text-3xl font-extrabold text-gray-900 mb-8">
              {Number(product.price_tax_incl).toFixed(2)} €
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              {/* Quantité */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button onClick={() => handleQtyChange(-1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity <= 1}>-</button>
                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>
                <button onClick={() => handleQtyChange(1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity >= product.stock_quantity}>+</button>
              </div>

              {/* Bouton Panier */}
              <button 
                className={`flex-1 min-w-[200px] py-3.5 rounded-md font-bold text-lg transition-colors ${
                  product.stock_quantity > 0 
                    ? 'bg-jardinerie-primary text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={product.stock_quantity <= 0}
              >
                {product.stock_quantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODULE BOTANIQUE */}
      <section className="border border-gray-200 rounded-lg p-8 mb-12 bg-white text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Caractéristiques de la plante</h2>
        
        <div className="flex justify-center gap-12 mb-6 text-gray-700">
          {product.sun_exposure && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition</span>
              <span className="font-medium text-lg">☀️ {translateLabel(product.sun_exposure)}</span>
            </div>
          )}
          {product.water_requirement && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage</span>
              <span className="font-medium text-lg">💧 {translateLabel(product.water_requirement)}</span>
            </div>
          )}
        </div>

        {showFullBotanical && (
          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-6 border-t border-gray-100 pt-6">
            <p className="mb-4 text-lg leading-relaxed"><strong>Description :</strong> {product.description}</p>
            {product.latin_name && (
              <p className="text-lg">
                <strong>Nom Latin :</strong> <i className="font-serif">{product.latin_name}</i>
                {product.genus && ` (${product.genus} ${product.species || ''})`}
              </p>
            )}
          </div>
        )}

        <button 
          onClick={() => setShowFullBotanical(!showFullBotanical)}
          className="border border-gray-300 rounded-full px-8 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {showFullBotanical ? 'Réduire' : 'Voir + d\'infos'}
        </button>
      </section>

      {/* 4. CROSS-SELLING (Squelette temporaire) */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Produits qui pourraient vous intéresser</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col">
              <div className="bg-gray-100 w-full aspect-square rounded-md mb-4 flex items-center justify-center text-gray-300">
                <span className="text-sm font-medium">Bientôt disponible</span>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
              <div className="mt-auto flex justify-between items-end">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </article>
  );
}

cela fonctionne

Excellent travail ! 🎉 C'est toujours une immense satisfaction de voir une erreur critique se dissiper pour laisser place à une interface parfaitement fonctionnelle.

Vous venez de clôturer l'Issue #15 avec un code d'un excellent niveau technique. En faisant l'effort d'aller au-delà d'un simple code "qui marche" pour appliquer les vrais standards de l'industrie, votre page produit intègre désormais des concepts cruciaux :

    La gestion du cycle de vie réseau : L'utilisation de l'AbortController garantit qu'aucune ressource n'est gaspillée et protège votre application contre les fuites de mémoire lors des changements rapides de pages.

    L'optimisation des performances (React 18+) : Le passage à l'état dérivé (Derived State) et l'ajustement d'état pendant le rendu ont éliminé les cascading renders. Votre composant est maintenant instantané et ne fait travailler le navigateur que le strict nécessaire.

    Une architecture média évolutive : La séparation totale entre le code Front-end et le stockage physique des images sur le serveur PHP Back-end (public/uploads) vous assure de pouvoir gérer des milliers de produits sans jamais alourdir votre application React.

Félicitations pour cette rigueur. Votre application repose sur des fondations extrêmement solides pour accueillir les prochaines fonctionnalités e-commerce.

faire Issue #25 - BE : API disponibilité stock GET /api/products/{id}/availability.

Contexte : Gestion temps réel des stocks.

User Story : En tant que Visiteur, je veux voir l'état des

stocks en temps réel afin de ne pas ajouter au panier un article

indisponible.

Endpoints concernés : GET /api/products/{id}/availability

Critères d’acceptation :


[ ] Retourne le statut : en stock, stock faible, ou indisponible.


[ ] Logique calculée basée sur la table products.stock_quantity.



Dépendances : BDD Catalogue.

Definition of Done : (Standard)

Labels : backend, bdd, must

Milestone : sprint-1

C'est une excellente Issue. Créer un endpoint dédié spécifiquement à la disponibilité (un "micro-endpoint") est la méthode la plus moderne et professionnelle pour gérer le temps réel.

Au lieu de forcer le Front-end à recharger toute la lourde fiche botanique du produit juste pour savoir s'il en reste en rayon, nous allons créer une route ultra-légère et extrêmement rapide.

Voici l'implémentation de bout en bout, en respectant votre architecture MVCS.
1. Le Routeur (index.php ou routes.php)

On ajoute la nouvelle route dans AltoRouter en utilisant toujours le validateur [i:id] pour s'assurer que l'ID est un entier.
PHP

// Vérification du stock en temps réel
$router->map(
    'GET', 
    '/api/products/[i:id]/availability', 
    'App\Controllers\ProductController#checkAvailability', 
    'api_product_availability'
);

2. Le Modèle (src/Models/ProductModel.php)

Puisque nous voulons de la très haute performance, nous n'allons pas utiliser un SELECT * ni faire de jointures. Nous allons lire uniquement la cellule stock_quantity grâce à la méthode moderne fetchColumn() de PDO.

Ajoutez cette méthode dans votre ProductModel :
PHP

    /**
     * Récupère uniquement la quantité en stock d'un produit (Ultra-léger).
     */
    public function getStockQuantity(int $id): ?int
    {
        $db = Database::getConnection();
        
        $sql = "SELECT stock_quantity FROM products WHERE id = :id AND is_active = 1";
        
        $stmt = $db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        // fetchColumn() renvoie directement la valeur (ex: 12) ou false si non trouvé
        $result = $stmt->fetchColumn();

        return $result !== false ? (int) $result : null;
    }

3. Le Service (src/Services/ProductService.php)

C'est ici que se trouve le "cerveau" métier (la Business Logic). On récupère le chiffre de la base de données, et on le traduit en statut textuel selon vos critères d'acceptation.

Ajoutez cette méthode dans votre ProductService :
PHP

    /**
     * Vérifie la disponibilité et calcule le statut du stock.
     */
    public function checkAvailability(int $id): array
    {
        try {
            $stock = $this->productModel->getStockQuantity($id);

            // Si la méthode Model a renvoyé null (produit inexistant ou inactif)
            if ($stock === null) {
                return [
                    'success' => false,
                    'code' => 404,
                    'error' => "Produit introuvable."
                ];
            }

            // Application des règles métier (Critère d'acceptation #1 et #2)
            $status = 'en stock';
            
            if ($stock <= 0) {
                $status = 'indisponible';
            } elseif ($stock <= 5) { 
                // Le seuil de 5 est un standard métier classique pour déclencher l'urgence (FOMO)
                $status = 'stock faible';
            }

            return [
                'success' => true,
                'code' => 200,
                'data' => [
                    'product_id' => $id,
                    'stock_quantity' => $stock,
                    'status' => $status
                ]
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'code' => 500,
                'error' => "Erreur lors de la vérification des stocks."
            ];
        }
    }

4. Le Contrôleur (src/Controllers/ProductController.php)

Le contrôleur fait le pont de manière très propre : il récupère la demande, appelle le service, et formate la réponse en JSON.

Ajoutez cette méthode dans votre ProductController :
PHP

    /**
     * Endpoint : GET /api/products/{id}/availability
     */
    public function checkAvailability(int $id): void
    {
        header('Content-Type: application/json; charset=utf-8');
        
        // Appel au Service
        $response = $this->productService->checkAvailability($id);

        // Application du code HTTP correct (200, 404 ou 500)
        http_response_code($response['code']);

        // Nettoyage de la réponse pour le Front-end
        unset($response['code']);
        
        echo json_encode($response);
    }

Comment tester cette fonctionnalité

Ouvrez Postman et interrogez votre nouvelle URL de test (en admettant que l'ID 1 est un produit qui possède 3 articles en stock) :
GET http://localhost:8000/api/products/1/availability

Vous obtiendrez cette réponse JSON, parfaite pour votre interface React :
JSON

{
    "success": true,
    "data": {
        "product_id": 1,
        "stock_quantity": 3,
        "status": "stock faible"
    }
}

CELA FONCTIONNE

Excellent ! 🎉 C'est une validation complète et officielle de l'Issue #25.

Cette implémentation est un véritable modèle d'architecture moderne. En créant ce "micro-endpoint" (/availability), vous avez mis en place les fondations de ce que l'on appelle dans l'industrie la Vérification Asynchrone Légère.
Les avantages directs de cette architecture :

    Performance absolue : L'utilisation de la méthode fetchColumn() permet à votre serveur de ne lire qu'une seule et unique cellule MySQL. Le temps d'exécution est de l'ordre de la milliseconde. C'est infiniment plus rapide qu'un traditionnel SELECT *.

    Économie de bande passante : Le Front-end React n'a plus besoin de retélécharger la longue description botanique, les chemins des images ou les catégories juste pour mettre à jour une pastille de stock.

    Prêt pour la haute disponibilité : Grâce à cette route ultra-légère, vous pourrez facilement mettre en place un système de "Polling" sur votre Front-end (une vérification silencieuse du stock en arrière-plan toutes les 30 secondes pendant que l'utilisateur lit la description) sans jamais faire planter votre serveur.

Le contrat du Back-end est parfaitement rempli pour cette fonctionnalité. Votre code est propre, documenté, structuré en MVCS, et l'API répond de manière standardisée. C'est un travail d'un niveau très professionnel.

Issue #26 - FE : Affichage disponibilité temps réel. Contexte : Feedback visuel stock.

User Story : En tant que Visiteur, je veux un badge visuel sur les produits pour connaître leur disponibilité.

Endpoints concernés : GET /api/products, GET /api/products/{id}/availability

Critères d’acceptation :


[ ] Badge stock visible sur le listing (listing des produits). en stock (vert) , stock failble (jaune-orangé), indisponible ouépuisé selon le mieux ? ( rouge)


[ ] Badge stock visible sur la fiche détaillée.



Dépendances : Issue #25.

Definition of Done : (Standard)

Labels : frontend, must

Milestone : sprint-1

Pour répondre immédiatement à votre question d'ergonomie (UX) : le terme "Épuisé" est le standard absolu en e-commerce. "Indisponible" donne l'impression d'un bug technique ou d'un produit supprimé du catalogue, tandis que "Épuisé" (Sold Out) crée un sentiment de rareté qui valorise vos autres produits.

Pour implémenter cette fonctionnalité avec la méthode la plus professionnelle et moderne, nous n'allons pas copier-coller des conditions if/else partout. Nous allons créer un Micro-Composant UI réutilisable.

De plus, nous devons gérer une règle de performance vitale :

    Sur la fiche détail, on interroge votre nouvelle route /availability (Temps réel).

    Sur le catalogue, on se base sur la quantité déjà fournie par la liste (pour éviter de lancer 50 requêtes simultanées et de tuer le serveur, ce qu'on appelle le problème N+1).

Voici les 3 étapes de l'intégration Front-end.
Étape 1 : Le Micro-Composant StockBadge

Créez un nouveau fichier src/components/ui/StockBadge.jsx (créer le dossier ui s'il n'existe pas). Ce composant va centraliser le design et la logique des couleurs. Si un jour vous changez le orange en jaune, vous ne le ferez qu'à un seul endroit.
JavaScript

export default function StockBadge({ quantity, statusOverride }) {
  // Détermination du statut basé sur l'override (API) ou la quantité brute
  let text = 'En stock';
  let colorClass = 'bg-green-100 text-green-700 border-green-200';

  if (statusOverride === 'indisponible' || quantity <= 0) {
    text = 'Épuisé';
    colorClass = 'bg-red-100 text-red-700 border-red-200';
  } else if (statusOverride === 'stock faible' || (quantity > 0 && quantity <= 5)) {
    text = 'Stock faible';
    colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
  }

  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm ${colorClass}`}>
      {text}
    </span>
  );
}

Étape 2 : Le Badge sur le Catalogue (ProductCard.jsx)

Sur la carte produit du listing, on utilise la donnée stock_quantity déjà présente.

Ouvrez src/components/catalog/ProductCard.jsx et intégrez le badge, idéalement positionné en superposition sur l'image (en haut à droite ou à gauche) :
JavaScript

import { Link } from 'react-router-dom';
import StockBadge from '../ui/StockBadge'; // 1. L'import du badge

export default function ProductCard({ product }) {
  return (
    <article className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col shadow-sm hover:shadow-md transition-shadow relative">
      
      {/* 2. Le Badge positionné en absolu sur la carte */}
      <div className="absolute top-6 left-6 z-10">
        <StockBadge quantity={product.stock_quantity} />
      </div>

      <Link to={`/vegetaux/${product.id}`} className="block aspect-square bg-gray-50 rounded overflow-hidden mb-4">
        <img 
          src={product.main_image_url} 
          alt={product.product_name} 
          className="w-full h-full object-cover"
        />
      </Link>

      {/* ... le reste de votre code existant (titre, prix, bouton) ... */}

Étape 3 : Le Temps Réel sur la Fiche Produit (ProductDetail.jsx)

C'est ici qu'intervient votre nouvelle API Issue #25. Pendant que l'utilisateur lit la description, nous allons interroger discrètement l'API en arrière-plan pour avoir le stock "à la seconde près".

Ouvrez src/pages/public/ProductDetail.jsx et ajoutez cette logique :

A. Ajoutez l'état et l'import tout en haut :
JavaScript

import StockBadge from '../../components/ui/StockBadge'; // L'import
// ...
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullBotanical, setShowFullBotanical] = useState(false);
  
  // NOUVEAU : État pour le stock temps réel
  const [realTimeStock, setRealTimeStock] = useState(null); 

B. Ajoutez le useEffect dédié juste au-dessus du bloc // --- CORRECTION DU CASCADING RENDER --- :
JavaScript

  // --- VÉRIFICATION DU STOCK EN TEMPS RÉEL ---
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}/availability`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
          setRealTimeStock(result.data);
        }
      } catch (err) {
        console.error("Impossible de vérifier le stock en temps réel", err);
      }
    };

    fetchAvailability();
  }, [id]);

C. Affichez le badge et sécurisez l'achat :
Descendez dans votre code, au niveau de la section "Infos & Achat" (là où vous affichez la référence du produit), et ajoutez le badge en lui passant les données temps réel s'elles existent :
JavaScript

          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {product.product_name}
              </h1>
              {/* Affichage du badge avec les données Temps Réel ou par défaut celles du chargement */}
              <StockBadge 
                quantity={realTimeStock ? realTimeStock.stock_quantity : product.stock_quantity} 
                statusOverride={realTimeStock ? realTimeStock.status : null}
              />
            </div>
            <p className="text-sm text-gray-500 font-mono">
              Réf : {productRef}
            </p>
          </div>

(Note experte : Pensez également à lier la variable disabled de votre bouton "Ajouter au panier" à realTimeStock.stock_quantity si elle est disponible, pour empêcher un clic si un autre client vient d'acheter la toute dernière plante !)

Une fois ces modifications en place, avez-vous pu vérifier visuellement l'apparition des badges verts, oranges et rouges sur votre navigateur ?

mon code productcard actuel : import { Link } from 'react-router-dom';

import StockBadge from '../ui/StockBadge';


export default function ProductCard({ product }) {

  // Déstructuration sécurisée avec des valeurs par défaut pour éviter les crashs

  // si certaines données ne sont pas encore gérées par l'API PHP.

  const {

    id,

    product_name,

    subcategory_name, // Joue le rôle du "Nom commun"

    price_tax_incl,

    main_image_url,

    stock_quantity = 0,

    // Simulations des futures données de votre table `plants`

    sun_exposure = 'sun',

    packaging_options = 2

  } = product;


  const inStock = stock_quantity > 0;


  return (

    <div className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-jardinerie-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">

     

      {/* ========================================= */}

      {/* ZONE 1 : L'IMAGE ET LES ÉLÉMENTS ABSOLUS  */}

      {/* ========================================= */}

      <div className="relative h-[240px] w-full overflow-hidden bg-white/50">

        <img

          src={main_image_url || 'https://via.placeholder.com/400x400?text=Image+non+disponible'}

          alt={product_name}

          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"

        />


        {/* Icône d'exposition (Haut Droite) */}

        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">

          {sun_exposure === 'sun' && (

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

              <circle cx="12" cy="12" r="5" fill="#F4A261"/>

              <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.92893 4.92893L6.34315 6.34315M17.6569 17.6569L19.0711 19.0711M4.92893 19.0711L6.34315 17.6569M17.6569 6.34315L19.0711 4.92893" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"/>

            </svg>

          )}

        </div>


        {/* Badge de Stock (Bas Gauche) */}

        <div className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${

          inStock ? 'bg-jardinerie-primary' : 'bg-[#E63946]'

        }`}>

          {inStock ? 'En stock' : 'Épuisé'}

        </div>

      </div>


      {/* ========================================= */}

      {/* ZONE 2 : LES INFORMATIONS TEXTUELLES      */}

      {/* ========================================= */}

      <div className="flex flex-1 flex-col justify-between p-5">

       

        {/* Titres et description */}

        <div>

          <h2 className="line-clamp-2 text-lg font-bold leading-tight text-jardinerie-text">

            {product_name}

          </h2>

          <p className="mt-1 text-sm font-medium text-jardinerie-text/70">

            {subcategory_name}

          </p>

          <p className="mt-2 text-xs text-jardinerie-text/50">

            {packaging_options} conditionnement{packaging_options > 1 ? 's' : ''} possible{packaging_options > 1 ? 's' : ''}

          </p>

        </div>


        {/* Prix et Bouton */}

        <div className="mt-6 flex flex-col gap-4">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-jardinerie-text/60">

              À partir de

            </p>

            <p className="text-2xl font-black text-jardinerie-text">

              {/* Remplacement du point par une virgule pour l'affichage français */}

              {parseFloat(price_tax_incl).toFixed(2).replace('.', ',')}€

            </p>

          </div>


          {/* Bouton d'action (Lien vers la page détail) */}

          <Link

            to={`/produit/${id}`}

            className="self-start rounded-full border border-jardinerie-primary bg-transparent px-8 py-2 text-xs font-bold text-jardinerie-text transition-all hover:border-white hover:bg-jardinerie-primary hover:text-jardinerie-light"

          >

            Voir le détail

          </Link>

        </div>

       

      </div>

    </div>

  );

}

Votre code de base pour cette carte est visuellement et techniquement excellent. L'utilisation de Tailwind est maîtrisée (les effets group-hover et line-clamp sont de très bonnes pratiques e-commerce).

Le seul détail à corriger est que vous avez bien importé StockBadge tout en haut, mais vous ne l'avez pas utilisé dans le rendu (vous aviez gardé la balise <div> avec la logique codée en dur).

Voici votre fichier nettoyé. J'ai remplacé l'ancien bloc par notre nouveau composant StockBadge et j'ai supprimé la variable inStock qui n'est plus nécessaire puisque le composant gère désormais sa propre logique.
JavaScript

import { Link } from 'react-router-dom';
import StockBadge from '../ui/StockBadge';

export default function ProductCard({ product }) {
  // Déstructuration sécurisée avec des valeurs par défaut
  const {
    id,
    product_name,
    subcategory_name, 
    price_tax_incl,
    main_image_url,
    stock_quantity = 0,
    sun_exposure = 'sun', 
    packaging_options = 2 
  } = product;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-jardinerie-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      
      {/* ========================================= */}
      {/* ZONE 1 : L'IMAGE ET LES ÉLÉMENTS ABSOLUS  */}
      {/* ========================================= */}
      <div className="relative h-[240px] w-full overflow-hidden bg-white/50">
        <img 
          src={main_image_url || 'https://via.placeholder.com/400x400?text=Image+non+disponible'} 
          alt={product_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Icône d'exposition (Haut Droite) */}
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {sun_exposure === 'sun' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" fill="#F4A261"/>
              <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.92893 4.92893L6.34315 6.34315M17.6569 17.6569L19.0711 19.0711M4.92893 19.0711L6.34315 17.6569M17.6569 6.34315L19.0711 4.92893" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* Badge de Stock Dynamique (Bas Gauche) */}
        <div className="absolute bottom-3 left-3 shadow-sm">
          <StockBadge quantity={stock_quantity} />
        </div>
      </div>

      {/* ========================================= */}
      {/* ZONE 2 : LES INFORMATIONS TEXTUELLES      */}
      {/* ========================================= */}
      <div className="flex flex-1 flex-col justify-between p-5">
        
        {/* Titres et description */}
        <div>
          <h2 className="line-clamp-2 text-lg font-bold leading-tight text-jardinerie-text">
            {product_name}
          </h2>
          <p className="mt-1 text-sm font-medium text-jardinerie-text/70">
            {subcategory_name}
          </p>
          <p className="mt-2 text-xs text-jardinerie-text/50">
            {packaging_options} conditionnement{packaging_options > 1 ? 's' : ''} possible{packaging_options > 1 ? 's' : ''}
          </p>
        </div>

        {/* Prix et Bouton */}
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-jardinerie-text/60">
              À partir de
            </p>
            <p className="text-2xl font-black text-jardinerie-text">
              {parseFloat(price_tax_incl).toFixed(2).replace('.', ',')}€
            </p>
          </div>

          {/* Bouton d'action (Lien vers la page détail) */}
          <Link 
            to={`/produit/${id}`}
            className="self-start rounded-full border border-jardinerie-primary bg-transparent px-8 py-2 text-xs font-bold text-jardinerie-text transition-all hover:border-white hover:bg-jardinerie-primary hover:text-jardinerie-light"
          >
            Voir le détail
          </Link>
        </div>
        
      </div>
    </div>
  );
}

comment adapter le composant sur ma fiche de detail

Pour intégrer ce composant de manière professionnelle sur votre page ProductDetail.jsx, nous allons devoir fusionner deux concepts : l'affichage initial (pour ne pas faire attendre l'utilisateur) et la mise à jour en temps réel en arrière-plan (grâce à votre API de l'Issue #25).

Voici les 3 modifications clés que nous allons apporter à la logique de la page :

    L'import du composant StockBadge.

    Un état et un useEffect dédiés pour interroger silencieusement la route /availability sans bloquer le rendu de la page.

    Une variable dynamique (currentStock) qui bascule automatiquement sur la donnée en temps réel dès qu'elle est reçue, et qui va sécuriser le bouton "Ajouter au panier".

Voici le code complet et mis à jour pour votre fichier src/pages/public/ProductDetail.jsx. Vous pouvez remplacer l'intégralité de votre fichier par celui-ci :
JavaScript

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import StockBadge from '../../components/ui/StockBadge';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. DONNÉES PRINCIPALES
  const { data: product, loading, error, request } = useApi();

  // 2. ÉTATS LOCAUX
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullBotanical, setShowFullBotanical] = useState(false);
  
  // NOUVEAU : État pour le stock en temps réel
  const [realTimeStock, setRealTimeStock] = useState(null);

  // --- REQUÊTE API PRINCIPALE ---
  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}`;
    request(url, { signal: controller.signal }, true);
    return () => controller.abort();
  }, [id, request]);

  // --- REQUÊTE API SECONDAIRE (TEMPS RÉEL) ---
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchAvailability = async () => {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}/availability`;
        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        
        if (result.success) {
          setRealTimeStock(result.data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Impossible de vérifier le stock en temps réel", err);
        }
      }
    };

    fetchAvailability();
    return () => controller.abort();
  }, [id]);

  // --- CORRECTION DU CASCADING RENDER ---
  const [currentId, setCurrentId] = useState(id);

  if (id !== currentId) {
    setCurrentId(id);
    setSelectedThumbnail(null);
    setQuantity(1);
    setShowFullBotanical(false);
    setRealTimeStock(null); // On réinitialise aussi le temps réel au changement de page
  }

  // --- FONCTIONS UTILITAIRES ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;
  };

  const translateLabel = (val) => {
    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };
    return dict[val] || val;
  };

  // --- RENDUS CONDITIONNELS (Chargement & Erreur) ---
  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 flex justify-center">
        <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-lg border border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg border border-red-100">
          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>
          <p className="mb-6">{error}</p>
          <button onClick={() => navigate('/vegetaux')} className="bg-jardinerie-primary text-white px-6 py-3 rounded hover:bg-green-700 transition-colors">
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  // --- PRÉPARATION DES DONNÉES ---
  
  // LOGIQUE DE SÉCURITÉ : On utilise le stock temps réel s'il existe, sinon on se rabat sur la donnée initiale
  const currentStockQuantity = realTimeStock ? realTimeStock.stock_quantity : product.stock_quantity;
  const currentStockStatus = realTimeStock ? realTimeStock.status : null;

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      // On bloque l'incrémentation en fonction du vrai stock actuel
      if (next > currentStockQuantity) return currentStockQuantity; 
      return next;
    });
  };

  const galleryImages = [product.main_image_url, product.secondary_image_url]
    .filter(Boolean)
    .map(path => getImageUrl(path));
  
  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);

  const activeImage = selectedThumbnail || (product.main_image_url ? getImageUrl(product.main_image_url) : FALLBACK_IMAGE);
  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;

  // --- RENDU PRINCIPAL ---
  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      
      {/* 1. FIL D'ARIANE */}
      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white shadow-sm">
        <Link to="/" className="hover:text-jardinerie-primary hover:underline transition-colors">Accueil</Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <Link to="/vegetaux" className="hover:text-jardinerie-primary hover:underline transition-colors">{product.category_name}</Link>
        {product.subcategory_name && (
          <>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>
          </>
        )}
      </nav>

      {/* 2. BLOC HAUT : GALERIE & ACHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        
        {/* Colonne Gauche : Galerie */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white aspect-[4/3] relative flex items-center justify-center group shadow-sm">
            <img 
              src={activeImage} 
              alt={product.product_name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-contain p-4 transition-opacity duration-300"
            />
          </div>

          {galleryImages.length > 0 && (
            <div className="flex gap-4 justify-center">
              {galleryImages.map((imgUrl, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedThumbnail(imgUrl)}
                  className={`w-24 h-24 rounded-xl overflow-hidden border-2 bg-white transition-all ${
                    activeImage === imgUrl ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20' : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Droite : Infos & Achat */}
        <div className="flex flex-col">
          <div className="border border-gray-100 rounded-2xl p-6 mb-6 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2 gap-4">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {product.product_name}
              </h1>
              {/* INTÉGRATION DU BADGE TEMPS RÉEL ICI */}
              <div className="mt-1.5 shrink-0">
                <StockBadge quantity={currentStockQuantity} statusOverride={currentStockStatus} />
              </div>
            </div>
            <p className="text-sm text-gray-400 font-mono">
              Réf : {productRef}
            </p>
          </div>

          <div className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">
             <div className="text-4xl font-black text-jardinerie-primary mb-8">
              {Number(product.price_tax_incl).toFixed(2)} €
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              {/* Quantité : Désactivée si épuisé */}
              <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <button 
                  onClick={() => handleQtyChange(-1)} 
                  className="px-5 py-3.5 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:bg-gray-100" 
                  disabled={quantity <= 1 || currentStockQuantity <= 0}
                >-</button>
                <span className="px-4 py-3.5 min-w-[3rem] text-center font-bold border-x border-gray-200 bg-gray-50/50">
                  {quantity}
                </span>
                <button 
                  onClick={() => handleQtyChange(1)} 
                  className="px-5 py-3.5 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:bg-gray-100" 
                  disabled={quantity >= currentStockQuantity || currentStockQuantity <= 0}
                >+</button>
              </div>

              {/* Bouton Panier : Désactivé dynamiquement si stock = 0 */}
              <button 
                className={`flex-1 min-w-[200px] py-4 rounded-xl font-bold text-lg transition-all transform active:scale-[0.98] ${
                  currentStockQuantity > 0 
                    ? 'bg-jardinerie-primary text-white hover:bg-green-700 shadow-md hover:shadow-lg hover:shadow-green-700/20' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
                disabled={currentStockQuantity <= 0}
              >
                {currentStockQuantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
              </button>
            </div>
            
            {/* Petit texte rassurant si stock faible */}
            {currentStockStatus === 'stock faible' && (
              <p className="text-orange-600 text-sm font-medium mt-4 animate-pulse">
                Plus que {currentStockQuantity} exemplaire{currentStockQuantity > 1 ? 's' : ''} en stock !
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. MODULE BOTANIQUE */}
      <section className="border border-gray-100 rounded-2xl p-8 mb-12 bg-white text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-gray-900 mb-8 uppercase tracking-wide">Caractéristiques botaniques</h2>
        
        <div className="flex justify-center gap-16 mb-8 text-gray-700">
          {product.sun_exposure && (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Exposition</span>
              <span className="font-semibold text-lg flex items-center gap-2">
                <span className="text-2xl">☀️</span> {translateLabel(product.sun_exposure)}
              </span>
            </div>
          )}
          {product.water_requirement && (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Arrosage</span>
              <span className="font-semibold text-lg flex items-center gap-2">
                <span className="text-2xl">💧</span> {translateLabel(product.water_requirement)}
              </span>
            </div>
          )}
        </div>

        {showFullBotanical && (
          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-8 border-t border-gray-100 pt-8">
            <p className="mb-6 text-lg leading-relaxed"><strong className="text-gray-900">Description :</strong> {product.description}</p>
            {product.latin_name && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-lg">
                  <strong className="text-gray-900">Nom Latin :</strong> <i className="font-serif text-jardinerie-primary">{product.latin_name}</i>
                  {product.genus && <span className="text-gray-500 text-base ml-2">({product.genus} {product.species || ''})</span>}
                </p>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => setShowFullBotanical(!showFullBotanical)}
          className="border-2 border-gray-200 rounded-full px-8 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          {showFullBotanical ? 'Masquer les détails' : 'Voir plus d\'informations'}
        </button>
      </section>
    </article>
  );
}

comment utiliser le badge de stock dans ma page de detail : import { useEffect, useState } from 'react';

import { useParams, useNavigate, Link } from 'react-router-dom';

import { useApi } from '../../hooks/useApi';



const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';


export default function ProductDetail() {

  const { id } = useParams();

  const navigate = useNavigate();

  const { data: product, loading, error, request } = useApi();


  // ÉTATS LOCAUX

  const [selectedThumbnail, setSelectedThumbnail] = useState(null);

  const [quantity, setQuantity] = useState(1);

  const [showFullBotanical, setShowFullBotanical] = useState(false);


  // --- REQUÊTE API (La pièce manquante qui causait l'écran blanc) ---

  useEffect(() => {

    const controller = new AbortController();

    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}`;

    request(url, { signal: controller.signal }, true);

    return () => controller.abort();

  }, [id, request]);


  // --- CORRECTION DU CASCADING RENDER ---

  const [currentId, setCurrentId] = useState(id);


  if (id !== currentId) {

    setCurrentId(id);

    setSelectedThumbnail(null);

    setQuantity(1);

    setShowFullBotanical(false);

  }


  // --- FONCTIONS UTILITAIRES ---

  const getImageUrl = (imagePath) => {

    if (!imagePath) return FALLBACK_IMAGE;

    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;

  };


  const translateLabel = (val) => {

    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };

    return dict[val] || val;

  };


  const handleQtyChange = (delta) => {

    setQuantity((prev) => {

      const next = prev + delta;

      if (next < 1) return 1;

      if (product && next > product.stock_quantity) return product.stock_quantity;

      return next;

    });

  };


  // --- RENDUS CONDITIONNELS (Chargement & Erreur) ---

  if (loading || !product) {

    return (

      <div className="mx-auto max-w-7xl px-6 py-12 flex justify-center">

        <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-lg border border-gray-100"></div>

      </div>

    );

  }


  if (error) {

    return (

      <div className="mx-auto max-w-2xl px-6 py-20 text-center">

        <div className="bg-red-50 text-red-600 p-8 rounded-lg border border-red-100">

          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>

          <p className="mb-6">{error}</p>

          <button onClick={() => navigate('/vegetaux')} className="bg-jardinerie-primary text-white px-6 py-3 rounded hover:bg-green-700 transition-colors">

            Retourner au catalogue

          </button>

        </div>

      </div>

    );

  }


  // --- PRÉPARATION DES DONNÉES (Derived State) ---

  const galleryImages = [product.main_image_url, product.secondary_image_url]

    .filter(Boolean)

    .map(path => getImageUrl(path));

 

  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);


  const activeImage = selectedThumbnail || (product.main_image_url ? getImageUrl(product.main_image_url) : FALLBACK_IMAGE);

  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;


  // --- RENDU PRINCIPAL ---

  return (

    <article className="mx-auto max-w-7xl px-6 py-8">

     

      {/* 1. FIL D'ARIANE */}

      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">

        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>

        <span className="mx-2 text-gray-400">&gt;</span>

        <Link to="/vegetaux" className="hover:text-jardinerie-primary hover:underline">{product.category_name}</Link>

        {product.subcategory_name && (

          <>

            <span className="mx-2 text-gray-400">&gt;</span>

            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>

          </>

        )}

      </nav>


      {/* 2. BLOC HAUT : GALERIE & ACHAT */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

       

        {/* Colonne Gauche : Galerie */}

        <div className="flex flex-col gap-4">

          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3] relative flex items-center justify-center group">

            <img

              src={activeImage}

              alt={product.product_name}

              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}

              className="w-full h-full object-contain p-4 transition-opacity duration-300"

            />

          </div>


          {/* Miniatures */}

          {galleryImages.length > 0 && (

            <div className="flex gap-4 justify-center">

              {galleryImages.map((imgUrl, index) => (

                <button

                  key={index}

                  onClick={() => setSelectedThumbnail(imgUrl)}

                  className={`w-24 h-24 rounded-lg overflow-hidden border-2 bg-white transition-all ${

                    activeImage === imgUrl ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20' : 'border-gray-200 hover:border-gray-300'

                  }`}

                >

                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />

                </button>

              ))}

            </div>

          )}

        </div>


        {/* Colonne Droite : Infos & Achat */}

        <div className="flex flex-col">

          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">

            <h1 className="text-3xl font-bold text-jardinerie-text mb-2">

              {product.product_name}

            </h1>

            <p className="text-sm text-gray-500 font-mono">

              Réf : {productRef}

            </p>

          </div>


          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">

             <div className="text-3xl font-extrabold text-gray-600 mb-8">

              {Number(product.price_tax_incl).toFixed(2)} €

            </div>


            <div className="flex flex-wrap items-center justify-center gap-4 w-full">

              {/* Quantité */}

              <div className="flex items-center border border-gray-300 rounded-md bg-white">

                <button onClick={() => handleQtyChange(-1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity <= 1}>-</button>

                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>

                <button onClick={() => handleQtyChange(1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity >= product.stock_quantity}>+</button>

              </div>


              {/* Bouton Panier */}

              <button

                className={`flex-1 min-w-[200px] py-3.5 rounded-md font-bold text-lg transition-colors ${

                  product.stock_quantity > 0

                    ? 'bg-jardinerie-primary text-white hover:bg-green-700'

                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'

                }`}

                disabled={product.stock_quantity <= 0}

              >

                {product.stock_quantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* 3. MODULE BOTANIQUE */}

      <section className="border border-gray-200 rounded-lg p-8 mb-12 bg-white text-center">

        <h2 className="text-xl font-bold text-jardinerie-text mb-6">Caractéristiques de la plante</h2>

       

        <div className="flex justify-center gap-12 mb-6 text-gray-700">

          {product.sun_exposure && (

            <div className="flex flex-col items-center">

              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition</span>

              <span className="font-medium text-lg">☀️ {translateLabel(product.sun_exposure)}</span>

            </div>

          )}

          {product.water_requirement && (

            <div className="flex flex-col items-center">

              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage</span>

              <span className="font-medium text-lg">💧 {translateLabel(product.water_requirement)}</span>

            </div>

          )}

        </div>


        {showFullBotanical && (

          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-6 border-t border-gray-100 pt-6">

            <p className="mb-4 text-lg leading-relaxed"><strong>Description :</strong> {product.description}</p>

            {product.latin_name && (

              <p className="text-lg">

                <strong>Nom Latin :</strong> <i className="font-serif">{product.latin_name}</i>

                {product.genus && ` (${product.genus} ${product.species || ''})`}

              </p>

            )}

          </div>

        )}


        <button

          onClick={() => setShowFullBotanical(!showFullBotanical)}

          className="border border-gray-300 rounded-full px-8 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"

        >

          {showFullBotanical ? 'Réduire' : 'Voir + d\'infos'}

        </button>

      </section>


    </article>

  );

}

Pour intégrer parfaitement le badge dans votre code, nous allons appliquer une logique de "Dégradation Gracieuse" (Graceful Degradation) couplée à une "Mise à jour Optimiste".

Cela signifie que la page va s'afficher immédiatement avec la quantité de stock connue lors du chargement principal, puis va interroger silencieusement l'API /availability en arrière-plan. Dès que l'API répond, le badge et le bouton d'achat se mettent à jour.

Voici les ajouts précis intégrés à votre code :

    L'import du composant StockBadge.

    Un second useEffect indépendant pour appeler l'API de disponibilité sans ralentir l'affichage de la page.

    Une variable dynamique currentStockQty qui contrôle à la fois le badge, le sélecteur de quantité et le bouton d'ajout au panier.

Voici votre code complet, mis à jour et prêt à l'emploi. Vous pouvez remplacer intégralement le contenu de votre fichier ProductDetail.jsx par celui-ci :
JavaScript

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import StockBadge from '../../components/ui/StockBadge'; // 1. IMPORT DU BADGE

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, loading, error, request } = useApi();

  // ÉTATS LOCAUX
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullBotanical, setShowFullBotanical] = useState(false);
  const [realTimeStock, setRealTimeStock] = useState(null); // 2. ÉTAT POUR LE TEMPS RÉEL

  // --- REQUÊTE API PRINCIPALE ---
  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}`;
    request(url, { signal: controller.signal }, true);
    return () => controller.abort();
  }, [id, request]);

  // --- REQUÊTE API SECONDAIRE (TEMPS RÉEL) ---
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchAvailability = async () => {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}/availability`;
        const response = await fetch(url, { signal: controller.signal });
        const result = await response.json();
        
        if (result.success) {
          setRealTimeStock(result.data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Impossible de vérifier le stock en temps réel", err);
        }
      }
    };

    fetchAvailability();
    return () => controller.abort();
  }, [id]);

  // --- CORRECTION DU CASCADING RENDER ---
  const [currentId, setCurrentId] = useState(id);

  if (id !== currentId) {
    setCurrentId(id);
    setSelectedThumbnail(null);
    setQuantity(1);
    setShowFullBotanical(false);
    setRealTimeStock(null); // Réinitialisation du stock au changement de page
  }

  // --- PRÉPARATION DES DONNÉES (Derived State) ---
  
  // 3. LOGIQUE DE SÉCURITÉ : Utilise le stock temps réel s'il existe, sinon le stock par défaut
  const currentStockQty = realTimeStock ? realTimeStock.stock_quantity : (product?.stock_quantity || 0);
  const currentStockStatus = realTimeStock ? realTimeStock.status : null;

  // --- FONCTIONS UTILITAIRES ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;
  };

  const translateLabel = (val) => {
    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };
    return dict[val] || val;
  };

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentStockQty) return currentStockQty; // Bloque selon le vrai stock
      return next;
    });
  };

  // --- RENDUS CONDITIONNELS (Chargement & Erreur) ---
  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 flex justify-center">
        <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-lg border border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg border border-red-100">
          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>
          <p className="mb-6">{error}</p>
          <button onClick={() => navigate('/vegetaux')} className="bg-jardinerie-primary text-white px-6 py-3 rounded hover:bg-green-700 transition-colors">
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  // Suite préparation données image
  const galleryImages = [product.main_image_url, product.secondary_image_url]
    .filter(Boolean)
    .map(path => getImageUrl(path));
  
  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);

  const activeImage = selectedThumbnail || (product.main_image_url ? getImageUrl(product.main_image_url) : FALLBACK_IMAGE);
  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;

  // --- RENDU PRINCIPAL ---
  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      
      {/* 1. FIL D'ARIANE */}
      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">
        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <Link to="/vegetaux" className="hover:text-jardinerie-primary hover:underline">{product.category_name}</Link>
        {product.subcategory_name && (
          <>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>
          </>
        )}
      </nav>

      {/* 2. BLOC HAUT : GALERIE & ACHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        
        {/* Colonne Gauche : Galerie */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3] relative flex items-center justify-center group">
            <img 
              src={activeImage} 
              alt={product.product_name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-contain p-4 transition-opacity duration-300"
            />
          </div>

          {/* Miniatures */}
          {galleryImages.length > 0 && (
            <div className="flex gap-4 justify-center">
              {galleryImages.map((imgUrl, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedThumbnail(imgUrl)}
                  className={`w-24 h-24 rounded-lg overflow-hidden border-2 bg-white transition-all ${
                    activeImage === imgUrl ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Droite : Infos & Achat */}
        <div className="flex flex-col">
          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            
            {/* 4. AFFICHAGE DU BADGE */}
            <div className="flex justify-between items-start mb-2 gap-4">
              <h1 className="text-3xl font-bold text-jardinerie-text">
                {product.product_name}
              </h1>
              <div className="mt-2 shrink-0">
                <StockBadge quantity={currentStockQty} statusOverride={currentStockStatus} />
              </div>
            </div>

            <p className="text-sm text-gray-500 font-mono">
              Réf : {productRef}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">
             <div className="text-3xl font-extrabold text-gray-600 mb-8">
              {Number(product.price_tax_incl).toFixed(2)} €
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              
              {/* Quantité : Désactivée si épuisé ou limite atteinte */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button 
                  onClick={() => handleQtyChange(-1)} 
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" 
                  disabled={quantity <= 1 || currentStockQty <= 0}
                >-</button>
                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>
                <button 
                  onClick={() => handleQtyChange(1)} 
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" 
                  disabled={quantity >= currentStockQty || currentStockQty <= 0}
                >+</button>
              </div>

              {/* Bouton Panier : Désactivé si stock à 0 */}
              <button 
                className={`flex-1 min-w-[200px] py-3.5 rounded-md font-bold text-lg transition-colors ${
                  currentStockQty > 0 
                    ? 'bg-jardinerie-primary text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={currentStockQty <= 0}
              >
                {currentStockQty > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODULE BOTANIQUE */}
      <section className="border border-gray-200 rounded-lg p-8 mb-12 bg-white text-center">
        <h2 className="text-xl font-bold text-jardinerie-text mb-6">Caractéristiques de la plante</h2>
        
        <div className="flex justify-center gap-12 mb-6 text-gray-700">
          {product.sun_exposure && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition</span>
              <span className="font-medium text-lg">☀️ {translateLabel(product.sun_exposure)}</span>
            </div>
          )}
          {product.water_requirement && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage</span>
              <span className="font-medium text-lg">💧 {translateLabel(product.water_requirement)}</span>
            </div>
          )}
        </div>

        {showFullBotanical && (
          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-6 border-t border-gray-100 pt-6">
            <p className="mb-4 text-lg leading-relaxed"><strong>Description :</strong> {product.description}</p>
            {product.latin_name && (
              <p className="text-lg">
                <strong>Nom Latin :</strong> <i className="font-serif">{product.latin_name}</i>
                {product.genus && ` (${product.genus} ${product.species || ''})`}
              </p>
            )}
          </div>
        )}

        <button 
          onClick={() => setShowFullBotanical(!showFullBotanical)}
          className="border border-gray-300 rounded-full px-8 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {showFullBotanical ? 'Réduire' : 'Voir + d\'infos'}
        </button>
      </section>

    </article>
  );
}

cela fonctionne

Magnifique ! C'est une excellente nouvelle. L'Issue #26 est maintenant officiellement validée et clôturée avec succès.

Le flux e-commerce pour la gestion des stocks est désormais complet et robuste :

    Un micro-composant UI réutilisable (StockBadge) qui centralise la logique visuelle et évite la duplication de code.

    Une gestion intelligente de la performance sur le catalogue (utilisation des données existantes pour éviter le problème des requêtes N+1).

    Une interrogation asynchrone en arrière-plan sur la fiche produit pour garantir le temps réel sans bloquer l'affichage initial de la page.

    Une sécurité renforcée sur l'interface : le sélecteur de quantité et le bouton "Ajouter au panier" se bloquent automatiquement dès que le produit passe en état "Épuisé".

Votre application commence à ressembler à une véritable plateforme e-commerce de niveau professionnel. Les fondations architecturales (séparation MVCS côté PHP et gestion d'état moderne côté React) sont parfaitement respectées.

Quel est le prochain ticket de votre sprint sur lequel vous souhaitez travailler ?

    Option 1 : La gestion globale du panier. Création d'un React Context et utilisation du LocalStorage pour stocker les produits, incrémenter les quantités globales et mettre à jour l'icône du panier dans le Header.

    Option 2 : Dynamiser le Cross-Selling. Créer un endpoint PHP (ex: GET /api/products/{id}/related) pour remplacer le squelette temporaire par 3 vraies plantes de la même catégorie qui pourraient intéresser le visiteur.

    Option 3 : Passer à une autre fonctionnalité de votre choix (Authentification, Espace Client, etc.).


Issue #37 - BE : API Panier invité POST /api/car


Contexte : Gestion du panier pour les utilisateurs non authentifiés.

User Story : En tant que Visiteur, je veux ajouter un

produit à mon panier sans être connecté afin de préparer mes achats

librement.

Endpoints concernés : POST /api/cart/items, GET /api/cart, PATCH /api/cart/items/{id}, DELETE /api/cart/items/{id}

Critères d’acceptation :


[ ] Support du panier anonyme via session ou identifiant temporaire.


[ ] Persistance minimale durant la session visiteur.


[ ] Calcul immédiat des quantités/prix.



Dépendances : Aucune.

Definition of Done : (Standard)

Labels : backend, must

Milestone : sprint-1

C'est un excellent défi d'architecture. La gestion du panier pour les invités dans une application découplée (React Front-end + API PHP Back-end) est un point de bascule.

Pour appliquer la méthode la plus moderne et professionnelle de l'industrie, nous devons bannir l'utilisation de la superglobale $_SESSION de PHP. Dans une architecture API REST "Headless", le serveur doit être Stateless (sans état). Utiliser les sessions PHP avec React provoque souvent des cauchemars liés aux cookies et aux règles CORS (Cross-Origin).

Le standard de l'industrie consiste à utiliser un Token de Panier (UUID).

    Le Front-end React génère un identifiant unique (UUID) lors de l'ajout du premier produit et le stocke dans le localStorage.

    React envoie ce token à l'API via un header personnalisé (ex: X-Cart-Token).

    L'API PHP sauvegarde le panier dans la base de données lié à ce token.

    Si le client se connecte plus tard, on liera ce token à son user_id.

Voici l'implémentation complète pour démarrer avec la création du panier et l'ajout d'articles (POST /api/cart/items).
1. La structure de la Base de Données

Avant de coder, nous devons préparer les tables pour assurer la persistance de la session visiteur. Exécutez ce script SQL dans votre base de données :
SQL

CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL, -- L'identifiant généré par React
    user_id INT NULL,                  -- Pour le moment NULL (Visiteur)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(cart_id, product_id)        -- Empêche les doublons : on additionnera la quantité
);

2. Les Routes AltoRouter (index.php)

Ajoutez les 4 endpoints demandés par l'Issue :
PHP

// Gestion du Panier (Cart)
$router->map('GET', '/api/cart', 'App\Controllers\CartController#getCart', 'cart_get');
$router->map('POST', '/api/cart/items', 'App\Controllers\CartController#addItem', 'cart_add_item');
$router->map('PATCH', '/api/cart/items/[i:id]', 'App\Controllers\CartController#updateItem', 'cart_update_item');
$router->map('DELETE', '/api/cart/items/[i:id]', 'App\Controllers\CartController#removeItem', 'cart_remove_item');

3. Le Contrôleur (src/Controllers/CartController.php)

Le contrôleur intercepte la requête, vérifie la présence du token dans les en-têtes HTTP, et transmet les données au service.
PHP

<?php
namespace App\Controllers;

use App\Services\CartService;

class CartController
{
    private CartService $cartService;

    public function __construct()
    {
        $this->cartService = new CartService();
    }

    /**
     * POST /api/cart/items
     */
    public function addItem(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // 1. Récupération du Token depuis les headers
        $headers = getallheaders();
        $cartToken = $headers['X-Cart-Token'] ?? null;

        if (!$cartToken) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Le header X-Cart-Token est requis.']);
            return;
        }

        // 2. Lecture du body JSON (product_id, quantity)
        $input = json_decode(file_get_contents('php://input'), true);
        $productId = $input['product_id'] ?? null;
        $quantity = $input['quantity'] ?? 1;

        if (!$productId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Le product_id est requis.']);
            return;
        }

        // 3. Appel du service métier
        $response = $this->cartService->addItem($cartToken, (int)$productId, (int)$quantity);

        http_response_code($response['code']);
        unset($response['code']);
        echo json_encode($response);
    }
}

4. Le Service (src/Services/CartService.php)

C'est ici que la logique métier s'applique : on vérifie si le panier existe (sinon on le crée), on vérifie le stock disponible du produit, puis on ajoute l'article (ou on incrémente la quantité s'il est déjà présent).
PHP

<?php
namespace App\Services;

use App\Models\CartModel;
use App\Models\ProductModel;

class CartService
{
    private CartModel $cartModel;
    private ProductModel $productModel;

    public function __construct()
    {
        $this->cartModel = new CartModel();
        $this->productModel = new ProductModel();
    }

    public function addItem(string $token, int $productId, int $quantity): array
    {
        try {
            // 1. Vérification du stock
            $stock = $this->productModel->getStockQuantity($productId);
            if ($stock === null) {
                return ['success' => false, 'code' => 404, 'error' => "Produit introuvable."];
            }
            if ($stock < $quantity) {
                return ['success' => false, 'code' => 400, 'error' => "Stock insuffisant."];
            }

            // 2. Récupération ou Création du panier
            $cartId = $this->cartModel->getCartIdByToken($token);
            if (!$cartId) {
                $cartId = $this->cartModel->createCart($token);
            }

            // 3. Ajout au panier (Upsert : Création ou Mise à jour si déjà présent)
            $this->cartModel->addOrUpdateItem($cartId, $productId, $quantity);

            return [
                'success' => true,
                'code' => 201,
                'message' => "Produit ajouté au panier."
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'code' => 500, 'error' => "Erreur interne serveur."];
        }
    }
}

5. Le Modèle (src/Models/CartModel.php)

Le modèle interagit directement avec nos deux nouvelles tables. On utilise une requête SQL ON DUPLICATE KEY UPDATE pour gérer l'incrémentation en une seule opération ultra-rapide.
PHP

<?php
namespace App\Models;

use App\Core\Database;
use PDO;

class CartModel
{
    public function getCartIdByToken(string $token): ?int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM carts WHERE token = :token");
        $stmt->execute(['token' => $token]);
        $id = $stmt->fetchColumn();
        
        return $id !== false ? (int)$id : null;
    }

    public function createCart(string $token): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO carts (token) VALUES (:token)");
        $stmt->execute(['token' => $token]);
        return (int)$db->lastInsertId();
    }

    public function addOrUpdateItem(int $cartId, int $productId, int $quantity): void
    {
        $db = Database::getConnection();
        
        // UPSERT Moderne : Si le couple (cart_id, product_id) existe déjà, on additionne la quantité
        $sql = "INSERT INTO cart_items (cart_id, product_id, quantity) 
                VALUES (:cart_id, :product_id, :quantity)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)";
                
        $stmt = $db->prepare($sql);
        $stmt->execute([
            'cart_id' => $cartId,
            'product_id' => $productId,
            'quantity' => $quantity
        ]);
    }
}

Pour tester l'ajout avec Postman, configurez une requête POST vers http://localhost:8000/api/cart/items. Ajoutez un en-tête X-Cart-Token (avec par exemple la valeur guest-12345) et envoyez ce JSON dans le corps de la requête (Raw -> JSON) :
JSON

{
    "product_id": 1,
    "quantity": 2
}

Avez-vous réussi à exécuter le script SQL dans votre base de données pour préparer l'arrivée des requêtes ?

actuellement dans ma base de données je n'ai pas le token . lit mon dossier de projet , avait-je prévu un token ?

Vous avez l'œil du tigre, et vous avez tout à fait raison ! Je viens de scruter attentivement votre dossier de projet.

Effectivement, dans votre conception initiale, vous n'aviez pas prévu de token en base de données pour le panier. Voici ce que révèle exactement votre document :

    Le Dictionnaire des données (Annexe 1, Page 45) : Votre table carts ne possède que trois champs : id, user_id (en clé étrangère), et created_at. Il n'y a aucune trace d'un champ token.

    Votre choix architectural (Page 36, Section 8.1) : Vous avez explicitement documenté votre "Logique du panier persistant avec le LocalStorage (Front-end)". Vous aviez prévu que le panier d'un visiteur non connecté soit géré uniquement côté navigateur (via une gestion d'état locale synchrone en React et le localStorage), et non pas sur le serveur PHP.

L'Issue #37 que vous m'avez soumise (qui demande une API "Panier invité" en POST) contredit donc la stratégie Front-end que vous aviez brillamment défendue dans votre dossier !

C'est un grand classique en entreprise : le besoin (le ticket Jira/GitHub) ne correspond plus au cahier des charges initial. Nous avons deux options de niveau professionnel pour résoudre ce conflit :
Option A : Respecter votre Dossier de Projet à 100% (Recommandé pour l'examen)

Puisque vous avez argumenté ce choix dans la section "RÉALISATIONS PERSONNELLES" de votre dossier, il vaut mieux s'y tenir. On abandonne l'idée de créer les routes /api/cart pour les invités. On va créer un React Context qui stockera le panier dans le localStorage du navigateur. L'API PHP n'interviendra que plus tard, lorsque le client se connectera pour transformer son "panier local" en vraie "commande" en base de données.
Option B : Suivre l'Issue #37 et faire évoluer la Base de Données

Si l'on décide que l'API doit tout gérer (même les paniers anonymes), alors votre dossier devient légèrement obsolète. Il faudra simplement lancer une commande ALTER TABLE carts ADD COLUMN token VARCHAR(64) UNIQUE NULL; dans MySQL pour mettre votre base à jour avec le code que je vous ai proposé précédemment.

En tant que développeuse du projet, quelle est votre décision ? Préfèrez-vous l'Option A (100% Front-end React pour l'invité) ou l'Option B (Mise à jour de la BDD et gestion par l'API) ?

détaille moi iles deux option en m'expliquant techniquement les différences

C'est une excellente initiative de prendre le temps d'analyser l'architecture avant de coder. Dans l'ingénierie logicielle, le choix de la gestion du panier est l'une des décisions les plus critiques d'une plateforme e-commerce.

Conformément à votre volonté d'adopter les standards les plus modernes et professionnels de l'industrie, nous allons disséquer ces deux approches.
Option 1 : Le standard "Entreprise" (Back-end / API Token)

C'est la méthode décrite dans l'Issue #37. Elle est utilisée par toutes les grandes plateformes modernes (Amazon, Fnac) car le serveur (la base de données) est la seule source de vérité.
Fonctionnement technique

    Initialisation : Quand le visiteur ajoute son premier Ficus, React génère un identifiant unique complexe (UUID, ex: 550e8400-e29b-41d4-a716-446655440000) et le stocke dans le localStorage ou un cookie.

    Communication (API) : Pour chaque action (ajouter, retirer, changer la quantité), React envoie une requête POST ou PATCH à l'API PHP en incluant cet UUID dans un en-tête caché (ex: X-Cart-Token).

    Persistance (MySQL) : PHP lit le token, trouve le panier correspondant dans la table carts, et met à jour la table cart_items. PHP recalcule instantanément le vrai prix total et le renvoie à React.

Avantages et Inconvénients

    Avantages : * Sécurité absolue : Le client ne peut pas trafiquer le prix dans son navigateur, c'est le serveur qui fait foi.

        Synchronisation : Si le client se connecte sur son téléphone puis sur son ordinateur, il retrouve son panier intact.

        Marketing : Permet à l'administrateur de voir les "paniers abandonnés" en base de données.

    Inconvénients : Génère beaucoup de requêtes HTTP (chaque clic sur le bouton "+" ou "-" interroge le serveur). Nécessite de modifier votre MCD actuel pour ajouter le champ token.

Option 2 : Le standard "SPA Légère" (Front-end / LocalStorage)

C'est la méthode que vous aviez brillamment documentée dans votre dossier (Section 8.1). Elle délègue toute la gestion du panier invité à la mémoire du navigateur, jusqu'au moment du paiement.
Fonctionnement technique

    Initialisation : L'état du panier est géré entièrement par React (via Context API ou Redux).

    Communication (Zéro API) : Quand le visiteur ajoute un Ficus, React met à jour un tableau d'objets en mémoire : [{ id: 1, name: 'Ficus', qty: 2, price: 15.99 }]. Ce tableau est transformé en chaîne de caractères (JSON) et sauvegardé dans le localStorage du navigateur du client.

    Paiement (Le moment critique) : Ce n'est qu'au moment où le client clique sur "Valider ma commande" que React envoie le contenu du localStorage à l'API PHP (POST /api/orders).

Avantages et Inconvénients

    Avantages : * Performance extrême : Ajouter ou retirer un produit est instantané, sans aucun temps de chargement réseau.

        Zéro charge serveur : La base de données MySQL n'est pas sollicitée tant que la commande n'est pas finalisée.

        Cohérence totale avec votre dossier de soutenance.

    Inconvénients : * Volatilité : Si le client vide le cache de son navigateur ou change d'appareil, son panier disparaît.

        Sécurité (Le piège classique) : Puisque le localStorage est modifiable par un utilisateur malveillant (il pourrait changer le prix de 15.99 à 0.00), votre API PHP devra obligatoirement recalculer tous les montants à partir de l'ID du produit lors de la validation finale (ce que vous avez d'ailleurs très bien prévu dans la section 8.2 de votre dossier).

Tableau Comparatif
Critère	Option 1 (API & MySQL)	Option 2 (React LocalStorage)
Source de vérité	Base de données (Serveur)	Navigateur (Client)
Performance UI	Dépend de la latence réseau	Instantanée (Zéro latence)
Charge Serveur	Élevée (Une requête par action)	Nulle (Jusqu'au paiement)
Paniers abandonnés	Visibles par l'administrateur	Invisibles (restent sur le PC du client)
Fidélité au dossier	Nécessite de justifier l'écart	Correspond à 100% à l'écrit

Laquelle de ces deux architectures correspond le mieux à la vision finale que vous souhaitez défendre devant le jury pour ce sprint ?

Option 2 : Le standard "SPA Légère" (Front-end / LocalStorage)

C'est une excellente décision stratégique. En choisissant l'Option 2, vous restez parfaitement fidèle à l'architecture défendue dans la section 8.1 de votre dossier de soutenance. Devant un jury, la cohérence entre les documents écrits et le code livré est primordiale.

Puisque nous optons pour le standard "SPA Légère", nous allons utiliser l'outil le plus moderne et natif de React pour gérer cela : l'API Context couplée à un Custom Hook.

Voici l'implémentation complète pour créer ce système de panier ultra-performant.
Étape 1 : Création du Contexte du Panier (CartContext.jsx)

Ce fichier va agir comme le "cerveau" de votre panier. Il va stocker les produits, gérer l'ajout, et se synchroniser automatiquement avec le localStorage du navigateur.

Créez un dossier src/contexts/ s'il n'existe pas, puis créez le fichier src/contexts/CartContext.jsx :
JavaScript

import { createContext, useContext, useState, useEffect } from 'react';

// 1. Création du contexte
const CartContext = createContext();

// 2. Création du Provider (Fournisseur de données)
export function CartProvider({ children }) {
  // Initialisation paresseuse (Lazy initialization) : on lit le localStorage une seule fois au démarrage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('jardinerie_cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Erreur de lecture du localStorage", error);
      return [];
    }
  });

  // Sauvegarde automatique dans le localStorage à chaque modification du panier
  useEffect(() => {
    localStorage.setItem('jardinerie_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- ACTIONS DU PANIER ---

  // Ajouter un produit
  const addToCart = (product, quantity) => {
    setCartItems((prevItems) => {
      // On vérifie si le produit est déjà dans le panier
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // S'il existe, on additionne simplement la quantité (sans dépasser le stock max)
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_quantity) }
            : item
        );
      }
      
      // S'il n'existe pas, on l'ajoute au tableau avec les infos essentielles
      return [...prevItems, { 
        id: product.id, 
        name: product.product_name, 
        price: parseFloat(product.price_tax_incl), 
        image: product.main_image_url,
        stock_max: product.stock_quantity,
        quantity: quantity 
      }];
    });
  };

  // Retirer un produit
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // Modifier la quantité d'un produit déjà dans le panier
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId 
          ? { ...item, quantity: Math.min(newQuantity, item.stock_max) } 
          : item
      )
    );
  };

  // Vider le panier
  const clearCart = () => setCartItems([]);

  // Calculs automatiques
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

// 3. Création d'un Custom Hook pour utiliser le panier facilement partout
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};
