-- Migration : historique des mouvements de stock (N4-api-stock)
-- À lancer UNE SEULE FOIS, APRÈS 2026-11-catalogue-prix-rayons.sql et 2026-11-sols.sql. Compatible MariaDB 5.5 : ajouts seulement.
--
-- Vérification préalable (doit renvoyer 0 ligne, sinon la migration a déjà été faite) :
--   SHOW COLUMNS FROM `stock_movements` LIKE 'stock_after';
--
-- La table `stock_movements` existait sans être utilisée. Désormais, CHAQUE changement de stock y écrit une ligne :
--   sale      vente (webhook Stripe)                  quantity négative
--   restock   réception de marchandise, annulation    quantity positive
--   loss      casse, perte, plante abîmée             quantity négative
--   inventory comptage (le stock est fixé à une valeur) quantity = écart constaté (positif, négatif ou nul)
-- quantity est donc la VARIATION signée, stock_after le stock obtenu juste après.

USE `flavie-michel_jardinerie_db`;

ALTER TABLE `stock_movements`
  ADD COLUMN `stock_after` INT NULL DEFAULT NULL,
  ADD COLUMN `user_id` INT NULL DEFAULT NULL,
  ADD COLUMN `order_id` INT NULL DEFAULT NULL,
  ADD COLUMN `note` VARCHAR(255) NULL DEFAULT NULL,
  ADD INDEX `stock_movements_date_idx` (`movement_date`),
  ADD CONSTRAINT `fk_stock_movements_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stock_movements_orders` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL;

-- Vérification : 4 nouvelles colonnes
--   SHOW COLUMNS FROM `stock_movements`;
