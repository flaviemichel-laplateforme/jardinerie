-- Sélection de la base de données
USE `jardinerie_db`;

-- AJOUT RECOMMANDÉ : Configuration du canal de communication en UTF-8 moderne
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

-- Taxes (TVA française)
INSERT INTO `taxes` (`id`, `name`, `rate`) VALUES
(1, 'TVA Standard (20%)', 20.00),
(2, 'TVA Taux Réduit (10%)', 10.00);

-- Utilisateurs
-- Le mot de passe haché correspond à 'password' pour tous les comptes (généré via Bcrypt)
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
(1, 'Carte Bancaire', 'https://upload.wikimedia.org/wikipedia/commons/1/16/Former_Visa_%28company%29_logo.svg'),
(2, 'PayPal', 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg');

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
(4, 2, 'Terreaux & Engrais', NULL);

-- Sous-catégories
INSERT INTO `subcategories` (`id`, `category_id`, `name`) VALUES
(1, 1, 'Plantes Vertes'),
(2, 1, 'Orchidées'),
(3, 2, 'Arbustes'),
(4, 2, 'Plantes Aromatiques'),
(5, 3, 'Sécateurs & Cisailles'),
(6, 4, 'Terreaux Universels');

-- =====================================================================
-- 4. INSERTION DES PRODUITS ET PLANTES
-- =====================================================================

-- Produits
INSERT INTO `products` (`id`, `subcategory_id`, `tax_id`, `name`, `description`, `price_tax_incl`, `purchase_price_tax_incl`, `stock_quantity`, `main_image_url`, `is_active`) VALUES
(1, 1, 2, 'Monstera Deliciosa', 'Superbe plante tropicale au feuillage découpé. Parfaite pour décorer un grand salon.', 34.90, 15.00, 12, 'https://images.unsplash.com/photo-1614594975525-e45190c55d40?auto=format&fit=crop&w=600&q=80', 1),
(2, 1, 2, 'Ficus Lyrata', 'Arbre d\'intérieur très tendance avec ses larges feuilles en forme de lyre.', 45.00, 20.00, 5, 'https://images.unsplash.com/photo-1597055181300-e3633a207519?auto=format&fit=crop&w=600&q=80', 1),
(3, 2, 2, 'Phalaenopsis Blanc', 'Orchidée élégante à floraison longue durée. Idéale pour offrir.', 19.90, 8.50, 20, 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80', 1),
(4, 3, 2, 'Olivier Tige (Olea europaea)', 'Petit olivier formé en tige. Apporte une touche méditerranéenne à votre terrasse.', 65.00, 30.00, 3, 'https://images.unsplash.com/photo-1502083896352-259ab9e342d7?auto=format&fit=crop&w=600&q=80', 1),
(5, 4, 2, 'Basilic Grand Vert', 'Plante aromatique indispensable pour la cuisine estivale. Très parfumé.', 4.90, 1.50, 45, 'https://images.unsplash.com/photo-1615486171448-4fdcb700f13a?auto=format&fit=crop&w=600&q=80', 1),
(6, 4, 2, 'Menthe Verte', 'Idéale pour les infusions et cocktails. Pousse très rapidement.', 4.50, 1.20, 0, 'https://images.unsplash.com/photo-1622013898851-4091a10cd2bc?auto=format&fit=crop&w=600&q=80', 1),
(7, 5, 1, 'Sécateur Ergonomique Pro', 'Lames en acier trempé. Poignées ergonomiques antidérapantes. Idéal pour la taille régulière.', 24.50, 10.00, 15, 'https://images.unsplash.com/photo-1416879598466-0bfdc641dc94?auto=format&fit=crop&w=600&q=80', 1),
(8, 6, 1, 'Terreau Universel 50L', 'Terreau enrichi en engrais organique pour toutes les plantations.', 12.90, 5.00, 50, 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80', 1);

-- Détails Botaniques (Seulement pour les produits du rayon Végétaux : ID 1 à 6)
-- Remarque : Les valeurs des ENUM correspondent strictement à celles de votre script.
INSERT INTO `plants` (`product_id`, `common_name`, `latin_name`, `genus`, `species`, `sun_exposure`, `water_requirement`) VALUES
(1, 'Faux philodendron', 'Monstera deliciosa', 'Monstera', 'deliciosa', 'Partial Shade', 'Medium'),
(2, 'Figuier lyre', 'Ficus lyrata', 'Ficus', 'lyrata', 'Sun', 'Medium'),
(3, 'Orchidée papillon', 'Phalaenopsis', 'Phalaenopsis', 'amabilis', 'Partial Shade', 'Low'),
(4, 'Olivier', 'Olea europaea', 'Olea', 'europaea', 'Sun', 'Low'),
(5, 'Basilic', 'Ocimum basilicum', 'Ocimum', 'basilicum', 'Sun', 'High'),
(6, 'Menthe', 'Mentha spicata', 'Mentha', 'spicata', 'Partial Shade', 'High');

-- Filtres et Critères dynamiques
INSERT INTO `criteria` (`id`, `name`) VALUES
(1, 'Plante dépolluante'),
(2, 'Facile d\'entretien'),
(3, 'Animaux-friendly (Non toxique)'),
(4, 'Comestible');

INSERT INTO `plant_criterion` (`plant_id`, `criterion_id`) VALUES
(1, 1), (1, 2), -- Monstera: Dépolluante, Facile
(2, 1), -- Ficus: Dépolluante
(3, 3), -- Orchidée: Animaux-friendly
(4, 2), -- Olivier: Facile
(5, 4), -- Basilic: Comestible
(6, 4), (6, 2); -- Menthe: Comestible, Facile

-- =====================================================================
-- 5. INSERTION DE COMMANDES (Pour le tableau de bord Admin et Profil)
-- =====================================================================

-- Commandes
INSERT INTO `orders` (`id`, `user_id`, `payment_method_id`, `delivery_method_id`, `billing_address_id`, `shipping_address_id`, `billing_address_text`, `shipping_address_text`, `order_reference`, `order_date`, `total_amount_tax_incl`, `shipping_cost_tax_incl`, `status`) VALUES
(1, 2, 1, 2, 1, 1, 'Jean Dupont\n12 Rue des Lilas\n75011 Paris\nFrance', 'Jean Dupont\n12 Rue des Lilas\n75011 Paris\nFrance', 'CMD-20260615-001', '2026-06-15 10:30:00', 41.80, 6.90, 'delivered'),
(2, 3, 2, 1, 2, 2, 'Marie Curie\n45 Avenue de la République\n69002 Lyon\nFrance', 'Marie Curie\n45 Avenue de la République\n69002 Lyon\nFrance', 'CMD-20260616-002', '2026-06-16 14:15:00', 65.00, 0.00, 'pending');

-- Lignes de commandes
INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `unit_price_tax_incl`) VALUES
(1, 1, 1, 34.90), -- 1 Monstera (Commande 1)
(2, 4, 1, 65.00); -- 1 Olivier (Commande 2)