-- Contrainte d'unicité sur la référence des commandes (lot N3-api : panier et paiement).
-- Elle empêche que deux livraisons simultanées du même webhook Stripe créent deux commandes.
--
-- À LANCER SEULEMENT SI la base de production n'a pas déjà cet index. Il est dans script-jardinerie.sql, donc probablement présent.
-- Vérifier d'abord (phpMyAdmin > onglet SQL) :
--     SHOW INDEX FROM `orders` WHERE `Column_name` = 'order_reference';
--   -> une ligne avec Non_unique = 0 : l'index existe, NE PAS lancer ce fichier.
--   -> aucune ligne (ou Non_unique = 1) : vérifier qu'il n'y a aucun doublon, puis lancer le fichier.
--     SELECT `order_reference`, COUNT(*) FROM `orders` GROUP BY `order_reference` HAVING COUNT(*) > 1;   -- doit renvoyer 0 ligne
-- Compatible MySQL et MariaDB 5.5.

USE `flavie-michel_jardinerie_db`;

ALTER TABLE `orders` ADD UNIQUE INDEX `order_reference_UNIQUE` (`order_reference` ASC);
