-- Migration : nature et pH du sol dans leurs propres tables (N4-api-catalogue)
-- À lancer UNE SEULE FOIS, APRÈS 2026-11-catalogue-prix-rayons.sql. Compatible MariaDB 5.5 : création de tables et recopie.
--
-- Méthode « étendre puis nettoyer » : les anciens critères « Sol … » de `criteria` et leurs liens RESTENT en place,
-- car l'ancien site public et l'ancien admin s'en servent jusqu'à la bascule (l'API continue de les tenir à jour).
-- Le nettoyage (2026-11-sols-nettoyage.sql) ne sera lancé QU'À LA BASCULE.
--
-- Vérification préalable (doit renvoyer 0 ligne, sinon la migration a déjà été faite) :
--   SHOW TABLES LIKE 'soil_types';

USE `flavie-michel_jardinerie_db`;

-- Les noms contiennent des accents (Humifère, Drainé) : la connexion doit être en UTF-8 quel que soit l'outil utilisé
SET NAMES utf8mb4;

-- 1. Nature du sol
CREATE TABLE IF NOT EXISTS `soil_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `soil_types_name_UNIQUE` (`name`)
) ENGINE = InnoDB;

-- 2. pH du sol
CREATE TABLE IF NOT EXISTS `soil_ph` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `soil_ph_name_UNIQUE` (`name`)
) ENGINE = InnoDB;

-- 3. Liens avec les plantes (une paire au plus ; supprimés avec la plante ou avec la valeur)
CREATE TABLE IF NOT EXISTS `plant_soil_type` (
  `plant_id` INT NOT NULL,
  `soil_type_id` INT NOT NULL,
  PRIMARY KEY (`plant_id`, `soil_type_id`),
  INDEX `plant_soil_type_soil_idx` (`soil_type_id`),
  CONSTRAINT `fk_plant_soil_type_plants` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_plant_soil_type_soil_types` FOREIGN KEY (`soil_type_id`) REFERENCES `soil_types` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `plant_soil_ph` (
  `plant_id` INT NOT NULL,
  `soil_ph_id` INT NOT NULL,
  PRIMARY KEY (`plant_id`, `soil_ph_id`),
  INDEX `plant_soil_ph_ph_idx` (`soil_ph_id`),
  CONSTRAINT `fk_plant_soil_ph_plants` FOREIGN KEY (`plant_id`) REFERENCES `plants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_plant_soil_ph_soil_ph` FOREIGN KEY (`soil_ph_id`) REFERENCES `soil_ph` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB;

-- 4. Valeurs de départ (modifiables ensuite depuis l'admin)
INSERT IGNORE INTO `soil_types` (`name`) VALUES ('Argileux'), ('Sableux'), ('Humifère'), ('Calcaire'), ('Drainé');
INSERT IGNORE INTO `soil_ph` (`name`) VALUES ('Acide'), ('Neutre'), ('Alcalin');

-- 5. Recopie des liens existants, par correspondance de nom. « Sol calcaire » alimente la nature (Calcaire) ET le pH (Alcalin).
INSERT IGNORE INTO `plant_soil_type` (`plant_id`, `soil_type_id`)
SELECT pc.`plant_id`, st.`id`
FROM `plant_criterion` pc
INNER JOIN `criteria` c ON c.`id` = pc.`criterion_id`
INNER JOIN `soil_types` st ON
     (c.`name` = 'Sol argileux' AND st.`name` = 'Argileux')
  OR (c.`name` = 'Sol sableux'  AND st.`name` = 'Sableux')
  OR (c.`name` = 'Sol humifère' AND st.`name` = 'Humifère')
  OR (c.`name` = 'Sol calcaire' AND st.`name` = 'Calcaire')
  OR (c.`name` = 'Sol drainé'   AND st.`name` = 'Drainé');

INSERT IGNORE INTO `plant_soil_ph` (`plant_id`, `soil_ph_id`)
SELECT pc.`plant_id`, sp.`id`
FROM `plant_criterion` pc
INNER JOIN `criteria` c ON c.`id` = pc.`criterion_id`
INNER JOIN `soil_ph` sp ON
     (c.`name` = 'Sol acide'    AND sp.`name` = 'Acide')
  OR (c.`name` = 'Sol neutre'   AND sp.`name` = 'Neutre')
  OR (c.`name` = 'Sol calcaire' AND sp.`name` = 'Alcalin');

-- Vérification : les deux nombres doivent être égaux (liens « Sol … » d'origine, sans compter « Sol calcaire » deux fois)
--   SELECT COUNT(*) FROM plant_criterion pc JOIN criteria c ON c.id = pc.criterion_id WHERE c.name LIKE 'Sol %';
--   SELECT (SELECT COUNT(*) FROM plant_soil_type) + (SELECT COUNT(*) FROM plant_soil_ph)
--        - (SELECT COUNT(*) FROM plant_criterion pc JOIN criteria c ON c.id = pc.criterion_id WHERE c.name = 'Sol calcaire');
