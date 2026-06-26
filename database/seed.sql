-- Sélection de la base de données
USE `jardinerie_db`;

-- Configuration du canal de communication en UTF-8 moderne
SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;

-- Désactivation temporaire des contraintes pour permettre le vidage des tables
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Vidage des tables (TRUNCATE) pour garantir un script idempotent
TRUNCATE TABLE `invoices`;
TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `delivery_methods`;
TRUNCATE TABLE `payment_methods`;
TRUNCATE TABLE `cart_items`;
TRUNCATE TABLE `carts`;
TRUNCATE TABLE `stock_movements`;
TRUNCATE TABLE `plant_criterion`;
TRUNCATE TABLE `criteria`;
TRUNCATE TABLE `plants`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `subcategories`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `departments`;
TRUNCATE TABLE `addresses`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `taxes`;

-- Réactivation des contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 2. INSERTION DES DONNÉES DE RÉFÉRENCE
-- =====================================================================

-- Taxes (TVA française : Standard, Moyen, Réduit)
INSERT INTO `taxes` (`id`, `name`, `rate`) VALUES
(1, 'TVA Standard (20%)', 20.00),
(2, 'TVA Taux Moyen (10%)', 10.00),
(3, 'TVA Taux Réduit (5.5%)', 5.50);

-- Utilisateurs (Mot de passe 'password' généré via Bcrypt)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `role`) VALUES
(1, 'Flavie', 'Admin', 'admin@jardinerie.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
(2, 'Jean', 'Dupont', 'jean.dupont@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer'),
(3, 'Marie', 'Curie', 'marie.curie@email.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer');

-- Adresses (Pour les clients)
INSERT INTO `addresses` (`id`, `user_id`, `recipient_first_name`, `recipient_last_name`, `street`, `postal_code`, `city`, `phone`) VALUES
(1, 2, 'Jean', 'Dupont', '12 Rue des Lilas', '75011', 'Paris', '0601020304'),
(2, 3, 'Marie', 'Curie', '45 Avenue de la République', '69002', 'Lyon', '0611223344');

-- Méthodes de paiement et Livraison
INSERT INTO `payment_methods` (`id`, `name`, `logo_url`) VALUES
(1, 'Carte Bancaire', NULL),
(2, 'PayPal', NULL);

INSERT INTO `delivery_methods` (`id`, `name`, `base_cost_tax_incl`, `free_shipping_threshold_tax_incl`) VALUES
(1, 'Click & Collect', 0.00, 0.00),
(2, 'Colissimo Standard', 6.90, 50.00),
(3, 'Chronopost Express', 12.90, 100.00);

-- =====================================================================
-- 3. INSERTION DU CATALOGUE (Arborescence)
-- =====================================================================

-- Rayons
INSERT INTO `departments` (`id`, `name`) VALUES
(1, 'Végétaux'),
(2, 'Jardinage & Entretien');

-- Catégories 
INSERT INTO `categories` (`id`, `department_id`, `name`, `icon_url`) VALUES
(1, 1, 'Plantes d\'intérieur', NULL),
(2, 1, 'Plantes d\'extérieur', NULL),
(3, 2, 'Outils à main', NULL),
(4, 2, 'Terreaux & Engrais', NULL),
(5, 1, 'Vivaces', NULL),
(6, 1, 'Annuelles', NULL),
(7, 1, 'Aromatiques', NULL),
(8, 1, 'Potagères', NULL);

-- Sous-catégories
INSERT INTO `subcategories` (`id`, `category_id`, `name`) VALUES
(1, 1, 'Plantes Vertes'),
(2, 1, 'Orchidées'),
(3, 2, 'Arbustes'),
(4, 7, 'Plantes Aromatiques'), 
(5, 3, 'Sécateurs & Cisailles'),
(6, 4, 'Terreaux Universels');

-- =====================================================================
-- 4. INSERTION DES PRODUITS ET PLANTES (Images neutralisées avec NULL)
-- =====================================================================

-- Produits d'origine (ID 1 à 8)
INSERT INTO `products` (`id`, `subcategory_id`, `tax_id`, `name`, `description`, `price_tax_incl`, `purchase_price_tax_incl`, `stock_quantity`, `main_image_url`, `is_active`) VALUES
(1, 1, 2, 'Monstera Deliciosa', 'Superbe plante tropicale au feuillage découpé.', 34.90, 15.00, 12, NULL, 1),
(2, 1, 2, 'Ficus Lyrata', 'Arbre d\'intérieur très tendance.', 45.00, 20.00, 5, NULL, 1),
(3, 2, 2, 'Phalaenopsis Blanc', 'Orchidée élégante à floraison longue durée.', 19.90, 8.50, 20, NULL, 1),
(4, 3, 2, 'Olivier Tige', 'Petit olivier formé en tige.', 65.00, 30.00, 3, NULL, 1),
(5, 4, 3, 'Basilic Grand Vert', 'Plante aromatique indispensable.', 4.90, 1.50, 45, NULL, 1), 
(6, 4, 3, 'Menthe Verte', 'Idéale pour les infusions.', 4.50, 1.20, 0, NULL, 1),       
(7, 5, 1, 'Sécateur Ergonomique Pro', 'Lames en acier trempé.', 24.50, 10.00, 15, NULL, 1),
(8, 6, 1, 'Terreau Universel 50L', 'Terreau enrichi en engrais organique.', 12.90, 5.00, 50, NULL, 1);

-- 20 Nouvelles Plantes (ID 9 à 28)
INSERT INTO `products` (`id`, `subcategory_id`, `tax_id`, `name`, `description`, `price_tax_incl`, `purchase_price_tax_incl`, `stock_quantity`, `main_image_url`, `is_active`) VALUES
(9, 1, 2, 'Aloe Vera', 'Plante grasse aux vertus apaisantes.', 12.90, 4.00, 30, NULL, 1),
(10, 1, 2, 'Sansevieria', 'Plante increvable, idéale pour débutants.', 18.50, 6.00, 25, NULL, 1),
(11, 1, 2, 'Zamioculcas', 'Feuillage brillant, très résistante.', 22.00, 8.00, 15, NULL, 1),
(12, 1, 2, 'Pilea Peperomioides', 'La fameuse plante à monnaie chinoise.', 14.90, 5.00, 40, NULL, 1),
(13, 1, 2, 'Calathea Makoyana', 'Feuillage aux motifs spectaculaires.', 24.90, 9.00, 12, NULL, 1),
(14, 1, 2, 'Spathiphyllum', 'Fleur de lune, excellente plante dépolluante.', 16.00, 5.50, 20, NULL, 1),
(15, 1, 2, 'Pothos Aureum', 'Plante retombante très facile à bouturer.', 11.50, 3.50, 35, NULL, 1),
(16, 2, 2, 'Cymbidium Rose', 'Grosse orchidée d\'hiver.', 35.00, 15.00, 8, NULL, 1),
(17, 2, 2, 'Dendrobium Nobile', 'Orchidée parfumée originaire d\'Asie.', 28.00, 12.00, 10, NULL, 1),
(18, 3, 2, 'Érable du Japon', 'Feuillage rouge flamboyant en automne.', 49.00, 22.00, 6, NULL, 1),
(19, 3, 2, 'Hortensia Bleu', 'Boules de fleurs majestueuses pour l\'ombre.', 25.00, 10.00, 14, NULL, 1),
(20, 3, 2, 'Rosier Buisson', 'Roses rouges classiques très parfumées.', 19.90, 8.00, 20, NULL, 1),
(21, 3, 2, 'Lavande Officinale', 'Parfum provençal et floraison estivale.', 9.50, 3.00, 50, NULL, 1),
(22, 3, 2, 'Bambou Fargesia', 'Bambou non traçant, idéal pour les haies.', 39.00, 18.00, 12, NULL, 1),
(23, 3, 2, 'Agapanthe', 'Grandes ombelles bleues estivales.', 18.50, 7.00, 18, NULL, 1),
(24, 4, 3, 'Ciboulette', 'Aromate classique et facile à cultiver.', 4.50, 1.20, 45, NULL, 1),
(25, 4, 3, 'Thym Citron', 'Parfum acidulé parfait pour les poissons.', 5.50, 1.50, 30, NULL, 1),
(26, 4, 3, 'Romarin', 'Arbuste aromatique robuste.', 6.50, 2.00, 25, NULL, 1),
(27, 4, 3, 'Persil Plat', 'Indispensable pour assaisonner vos plats.', 3.90, 1.00, 60, NULL, 1),
(28, 4, 3, 'Coriandre', 'Saveur exotique, pousse rapide.', 4.50, 1.20, 35, NULL, 1);

-- 20 Nouveaux Produits de Jardinage (ID 29 à 48)
INSERT INTO `products` (`id`, `subcategory_id`, `tax_id`, `name`, `description`, `price_tax_incl`, `purchase_price_tax_incl`, `stock_quantity`, `main_image_url`, `is_active`) VALUES
(29, 5, 1, 'Cisaille à haie', 'Lames ondulées pour une coupe nette.', 34.90, 15.00, 10, NULL, 1),
(30, 5, 1, 'Coupe-branches télescopique', 'Pour atteindre les hautes branches sans effort.', 45.00, 20.00, 8, NULL, 1),
(31, 5, 1, 'Transplantoir Inox', 'Petite pelle robuste pour vos pots.', 12.50, 5.00, 30, NULL, 1),
(32, 5, 1, 'Griffe 3 dents', 'Idéal pour aérer le sol en surface.', 11.00, 4.50, 25, NULL, 1),
(33, 5, 1, 'Bêche en acier forgé', 'Outil de base pour retourner la terre.', 39.90, 18.00, 12, NULL, 1),
(34, 5, 1, 'Râteau 14 dents', 'Pour niveler et ramasser les feuilles.', 22.50, 9.00, 15, NULL, 1),
(35, 5, 1, 'Sarcloir', 'Pour couper les mauvaises herbes.', 19.90, 8.00, 20, NULL, 1),
(36, 5, 1, 'Gants de jardinier en cuir', 'Protection optimale contre les ronces.', 18.00, 7.50, 40, NULL, 1),
(37, 5, 1, 'Arrosoir 11L', 'Arrosoir en plastique avec pomme amovible.', 14.50, 5.00, 50, NULL, 1),
(38, 5, 1, 'Pulvérisateur 5L', 'Pour le traitement de vos plantes.', 29.90, 12.00, 10, NULL, 1),
(39, 6, 1, 'Terreau Orchidées 5L', 'Substrat léger à base d\'écorces.', 7.50, 3.00, 60, NULL, 1),
(40, 6, 1, 'Terreau Agrumes 20L', 'Enrichi pour une fructification optimale.', 11.90, 5.00, 40, NULL, 1),
(41, 6, 1, 'Terreau Cactées 5L', 'Substrat très drainant avec sable.', 6.90, 2.50, 45, NULL, 1),
(42, 6, 1, 'Billes d\'argile 10L', 'Pour le drainage au fond des pots.', 9.50, 4.00, 80, NULL, 1),
(43, 6, 1, 'Engrais Liquide Universel', 'Flacon 1L, pour toutes plantes.', 8.90, 3.50, 50, NULL, 1),
(44, 6, 1, 'Engrais Granulés Rosiers', 'Boîte de 1kg, libération lente.', 12.50, 5.00, 30, NULL, 1),
(45, 6, 1, 'Engrais Gazon', 'Sac de 10kg pour un gazon bien vert.', 24.90, 10.00, 15, NULL, 1),
(46, 6, 1, 'Corne torréfiée 1kg', 'Engrais de fond 100% naturel.', 9.90, 4.00, 25, NULL, 1),
(47, 6, 1, 'Sang desséché 1kg', 'Action coup de fouet naturelle.', 10.50, 4.20, 25, NULL, 1),
(48, 6, 1, 'Paillage Écorces de pin 50L', 'Évite la pousse des mauvaises herbes.', 14.90, 6.00, 35, NULL, 1);

-- Détails Botaniques (Produits d'origine + Nouvelles plantes)
INSERT INTO `plants` (`product_id`, `common_name`, `latin_name`, `genus`, `species`, `sun_exposure`, `water_requirement`) VALUES
(1, 'Faux philodendron', 'Monstera deliciosa', 'Monstera', 'deliciosa', 'Partial Shade', 'Medium'),
(2, 'Figuier lyre', 'Ficus lyrata', 'Ficus', 'lyrata', 'Sun', 'Medium'),
(3, 'Orchidée papillon', 'Phalaenopsis', 'Phalaenopsis', 'amabilis', 'Partial Shade', 'Low'),
(4, 'Olivier', 'Olea europaea', 'Olea', 'europaea', 'Sun', 'Low'),
(5, 'Basilic', 'Ocimum basilicum', 'Ocimum', 'basilicum', 'Sun', 'High'),
(6, 'Menthe', 'Mentha spicata', 'Mentha', 'spicata', 'Partial Shade', 'High'),
(9, 'Aloé', 'Aloe vera', 'Aloe', 'vera', 'Sun', 'Low'),
(10, 'Langue de belle-mère', 'Sansevieria trifasciata', 'Sansevieria', 'trifasciata', 'Partial Shade', 'Low'),
(11, 'Plante ZZ', 'Zamioculcas zamiifolia', 'Zamioculcas', 'zamiifolia', 'Partial Shade', 'Low'),
(12, 'Plante à monnaie', 'Pilea peperomioides', 'Pilea', 'peperomioides', 'Partial Shade', 'Medium'),
(13, 'Plante paon', 'Calathea makoyana', 'Calathea', 'makoyana', 'Shade', 'High'),
(14, 'Fleur de lune', 'Spathiphyllum wallisii', 'Spathiphyllum', 'wallisii', 'Partial Shade', 'High'),
(15, 'Pothos', 'Epipremnum aureum', 'Epipremnum', 'aureum', 'Partial Shade', 'Medium'),
(16, 'Orchidée bateau', 'Cymbidium', 'Cymbidium', 'hybrid', 'Partial Shade', 'Medium'),
(17, 'Orchidée bambou', 'Dendrobium nobile', 'Dendrobium', 'nobile', 'Sun', 'Medium'),
(18, 'Érable japonais', 'Acer palmatum', 'Acer', 'palmatum', 'Partial Shade', 'Medium'),
(19, 'Hortensia', 'Hydrangea macrophylla', 'Hydrangea', 'macrophylla', 'Shade', 'High'),
(20, 'Rosier', 'Rosa', 'Rosa', 'gallica', 'Sun', 'Medium'),
(21, 'Lavande', 'Lavandula angustifolia', 'Lavandula', 'angustifolia', 'Sun', 'Low'),
(22, 'Bambou', 'Fargesia murielae', 'Fargesia', 'murielae', 'Partial Shade', 'High'),
(23, 'Lis du Nil', 'Agapanthus africanus', 'Agapanthus', 'africanus', 'Sun', 'Medium'),
(24, 'Ciboulette', 'Allium schoenoprasum', 'Allium', 'schoenoprasum', 'Sun', 'Medium'),
(25, 'Thym', 'Thymus citriodorus', 'Thymus', 'citriodorus', 'Sun', 'Low'),
(26, 'Romarin', 'Salvia rosmarinus', 'Salvia', 'rosmarinus', 'Sun', 'Low'),
(27, 'Persil', 'Petroselinum crispum', 'Petroselinum', 'crispum', 'Partial Shade', 'High'),
(28, 'Coriandre', 'Coriandrum sativum', 'Coriandrum', 'sativum', 'Sun', 'High');

-- Filtres et Critères dynamiques
INSERT INTO `criteria` (`id`, `name`) VALUES
(1, 'Plante dépolluante'),
(2, 'Facile d\'entretien'),
(3, 'Animaux-friendly (Non toxique)'),
(4, 'Comestible');

INSERT INTO `plant_criterion` (`plant_id`, `criterion_id`) VALUES
(1, 1), (1, 2),
(2, 1),
(3, 3),
(4, 2),
(5, 4),
(6, 4), (6, 2),
(9, 1), (9, 2),
(10, 1), (10, 2),
(14, 1),
(24, 4),
(25, 4), (25, 2),
(26, 4), (26, 2),
(27, 4),
(28, 4);

-- =====================================================================
-- 5. INSERTION DE COMMANDES (Pour le tableau de bord Admin et Profil)
-- =====================================================================

-- Commandes
INSERT INTO `orders` (`id`, `user_id`, `payment_method_id`, `delivery_method_id`, `billing_address_id`, `shipping_address_id`, `billing_address_text`, `shipping_address_text`, `order_reference`, `order_date`, `total_amount_tax_incl`, `shipping_cost_tax_incl`, `status`) VALUES
(1, 2, 1, 2, 1, 1, 'Jean Dupont\n12 Rue des Lilas\n75011 Paris\nFrance', 'Jean Dupont\n12 Rue des Lilas\n75011 Paris\nFrance', 'CMD-20260615-001', '2026-06-15 10:30:00', 41.80, 6.90, 'delivered'),
(2, 3, 2, 1, 2, 2, 'Marie Curie\n45 Avenue de la République\n69002 Lyon\nFrance', 'Marie Curie\n45 Avenue de la République\n69002 Lyon\nFrance', 'CMD-20260616-002', '2026-06-16 14:15:00', 65.00, 0.00, 'pending');

-- Lignes de commandes
INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `unit_price_tax_incl`) VALUES
(1, 1, 1, 34.90),
(2, 4, 1, 65.00);