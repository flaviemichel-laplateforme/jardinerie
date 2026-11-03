-- Migration de NETTOYAGE des anciens critères de sol — à lancer UNIQUEMENT LE JOUR DE LA BASCULE (étape 5),
-- quand l'ancien site (React) et l'ancien admin sont arrêtés. Avant cela, ils ont encore besoin de ces critères.
--
-- Ce que fait le script : supprime les 7 critères « Sol … » de `criteria` (leurs liens `plant_criterion` partent avec,
-- clé étrangère ON DELETE CASCADE). Les sols vivent désormais dans `soil_types` / `soil_ph` (2026-11-sols.sql).
-- Après ce script, l'API n'a plus d'anciens liens à tenir à jour (SoilLegacy ne trouve plus ces critères : rien à faire).
--
-- AVANT : faire une sauvegarde de la base, et vérifier que les liens ont bien été recopiés (voir 2026-11-sols.sql).

USE `flavie-michel_jardinerie_db`;

DELETE FROM `criteria`
WHERE `name` IN ('Sol argileux', 'Sol sableux', 'Sol humifère', 'Sol drainé', 'Sol acide', 'Sol neutre', 'Sol calcaire');

-- Remarque : l'ancienne colonne `products.purchase_price_tax_incl` (qui contenait en réalité un prix HT) n'est PAS supprimée ici :
-- l'API y écrit encore. Sa suppression demandera d'abord de retirer cette écriture du code (AdminProductModel), dans une PR dédiée.
