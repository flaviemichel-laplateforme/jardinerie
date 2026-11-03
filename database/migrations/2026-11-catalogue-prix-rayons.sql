-- Migration : prix d'achat HT et rayons « avec fiche botanique » (N4-api-catalogue)
-- À lancer UNE SEULE FOIS, AVANT 2026-11-sols.sql (phpMyAdmin / Plesk). Compatible MariaDB 5.5 : ajouts de colonnes seulement.
-- Relancer le script provoquerait une erreur « colonne déjà existante » (sans dommage).
--
-- Vérification préalable (doit renvoyer 0 ligne, sinon la migration a déjà été faite) :
--   SHOW COLUMNS FROM `products` LIKE 'purchase_price_excl_tax';

USE `flavie-michel_jardinerie_db`;

-- 1. Prix d'achat HORS TAXES.
-- L'ancien formulaire d'administration affichait « Prix achat HT » mais enregistrait la valeur dans `purchase_price_tax_incl` :
-- les montants existants sont donc DÉJÀ hors taxes, on les recopie tels quels (aucune conversion).
-- L'ancienne colonne est conservée jusqu'à la bascule : l'API y écrit la même valeur HT, l'ancien admin reste juste.
ALTER TABLE `products`
  ADD COLUMN `purchase_price_excl_tax` DECIMAL(10,2) NULL DEFAULT NULL AFTER `purchase_price_tax_incl`;

UPDATE `products` SET `purchase_price_excl_tax` = `purchase_price_tax_incl` WHERE `purchase_price_tax_incl` IS NOT NULL;

-- 2. Rayon « avec fiche botanique » : le formulaire n'affiche la fiche (et l'API ne l'accepte) que pour ces rayons.
-- Réglable ensuite depuis l'admin (page Catégories). Aucun identifiant ni nom écrit en dur : on active le drapeau
-- sur les rayons qui contiennent déjà au moins une fiche botanique (aujourd'hui : Végétaux).
ALTER TABLE `departments`
  ADD COLUMN `has_plant_sheet` TINYINT(1) NOT NULL DEFAULT 0;

UPDATE `departments` SET `has_plant_sheet` = 1
WHERE `id` IN (
  SELECT DISTINCT c.`department_id`
  FROM `plants` pl
  INNER JOIN `products` p      ON p.`id` = pl.`product_id`
  INNER JOIN `subcategories` s ON s.`id` = p.`subcategory_id`
  INNER JOIN `categories` c    ON c.`id` = s.`category_id`
);

-- Vérification : le rayon Végétaux doit avoir has_plant_sheet = 1, et les prix d'achat être recopiés
--   SELECT id, name, has_plant_sheet FROM departments;
--   SELECT COUNT(*) FROM products WHERE purchase_price_tax_incl IS NOT NULL AND purchase_price_excl_tax IS NULL;  -- 0 attendu
