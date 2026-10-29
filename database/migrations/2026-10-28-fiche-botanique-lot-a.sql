-- Migration : fiche botanique enrichie (Lot A)
-- À lancer UNE SEULE FOIS sur la base de production (phpMyAdmin / Plesk). Toutes les colonnes sont facultatives :
-- les produits existants ne sont pas modifiés. Relancer le script provoquerait une erreur « colonne déjà existante ».

USE `flavie-michel_jardinerie_db`;

-- Données botaniques
ALTER TABLE `plants`
  ADD COLUMN `family` VARCHAR(100) NULL DEFAULT NULL,
  ADD COLUMN `cultivar` VARCHAR(100) NULL DEFAULT NULL,
  ADD COLUMN `foliage` ENUM('Deciduous', 'Evergreen', 'Semi-evergreen') NULL DEFAULT NULL,
  ADD COLUMN `height_max_cm` SMALLINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `bloom_start_month` TINYINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `bloom_end_month` TINYINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `harvest_start_month` TINYINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `harvest_end_month` TINYINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `drought_tolerance` ENUM('Low', 'Medium', 'High') NULL DEFAULT NULL,
  ADD COLUMN `hardiness_min_c` SMALLINT NULL DEFAULT NULL,
  ADD COLUMN `difficulty` ENUM('Beginner', 'Intermediate', 'Expert') NULL DEFAULT NULL,
  ADD COLUMN `care_pruning` TEXT NULL DEFAULT NULL,
  ADD COLUMN `care_repotting` TEXT NULL DEFAULT NULL,
  ADD COLUMN `care_pests_diseases` TEXT NULL DEFAULT NULL;

-- Référence, conditionnement et poids (en grammes, pour de futurs frais de port au poids)
ALTER TABLE `products`
  ADD COLUMN `sku` VARCHAR(50) NULL DEFAULT NULL,
  ADD COLUMN `packaging_type` ENUM('Pot', 'Plug', 'Bare root', 'Root ball') NULL DEFAULT NULL,
  ADD COLUMN `pot_diameter_cm` SMALLINT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN `volume_l` DECIMAL(6,2) NULL DEFAULT NULL,
  ADD COLUMN `weight_g` INT UNSIGNED NULL DEFAULT NULL,
  ADD UNIQUE INDEX `sku_UNIQUE` (`sku`);

-- Critères de sol et de pH (ajoutés seulement s'ils n'existent pas déjà)
INSERT INTO `criteria` (`name`) SELECT 'Sol argileux' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol argileux');
INSERT INTO `criteria` (`name`) SELECT 'Sol sableux' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol sableux');
INSERT INTO `criteria` (`name`) SELECT 'Sol humifère' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol humifère');
INSERT INTO `criteria` (`name`) SELECT 'Sol drainé' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol drainé');
INSERT INTO `criteria` (`name`) SELECT 'Sol acide' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol acide');
INSERT INTO `criteria` (`name`) SELECT 'Sol neutre' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol neutre');
INSERT INTO `criteria` (`name`) SELECT 'Sol calcaire' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `criteria` WHERE `name` = 'Sol calcaire');
