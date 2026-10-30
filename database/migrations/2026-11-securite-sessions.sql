-- Migration : sécurité du lot S2 (sessions révocables, jetons hachés, limitation des tentatives, journal de sécurité)
-- À lancer UNE SEULE FOIS sur la base de production (phpMyAdmin / Plesk), AVANT d'envoyer les fichiers PHP du lot S2.
-- Relancer le script provoquerait une erreur « colonne déjà existante ».
-- Sans danger pour l'ancien code : tout ce qui est ajouté est facultatif, rien n'est supprimé.
-- Compatible MySQL et MariaDB.

USE `flavie-michel_jardinerie_db`;

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Utilisateurs : version de session (la révoquer = l'incrémenter) et date d'anonymisation
-- ---------------------------------------------------------------------------------------------------------------------
ALTER TABLE `users`
  ADD COLUMN `token_version` INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN `anonymized_at` DATETIME NULL DEFAULT NULL;

-- Les comptes déjà anonymisés avant cette migration sont repérés à leur adresse (voir UserModel::anonymize)
UPDATE `users` SET `anonymized_at` = NOW() WHERE `email` LIKE 'anonymized\_%@deleted.local';

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Jetons de vérification / réinitialisation : stockés hachés (SHA-256) au lieu d'être en clair
-- ---------------------------------------------------------------------------------------------------------------------
ALTER TABLE `account_tokens`
  MODIFY `purpose` ENUM('password_reset', 'email_verification', 'email_change') NOT NULL DEFAULT 'password_reset',
  MODIFY `token` VARCHAR(255) NULL,
  ADD COLUMN `token_hash` CHAR(64) NULL,
  ADD COLUMN `payload` VARCHAR(255) NULL,
  ADD UNIQUE INDEX `token_hash_UNIQUE` (`token_hash` ASC);

-- Les jetons encore valables continuent de fonctionner : leur empreinte est calculée ici
UPDATE `account_tokens` SET `token_hash` = SHA2(`token`, 256) WHERE `token` IS NOT NULL;

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. Limitation des tentatives : un compteur par « seau » (empreinte d'une action + d'une adresse ou d'une IP)
-- ---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `bucket` CHAR(64) NOT NULL,
  `hits` INT UNSIGNED NOT NULL,
  `window_start` DATETIME NOT NULL,
  PRIMARY KEY (`bucket`),
  INDEX `window_start_idx` (`window_start` ASC))
ENGINE = InnoDB;

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. Journal de sécurité (conservé 12 mois, purgé automatiquement)
-- ---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `email_hash` CHAR(64) NULL DEFAULT NULL,
  `event` VARCHAR(40) NOT NULL,
  `ip` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` VARCHAR(255) NULL DEFAULT NULL,
  `details` TEXT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `created_at_idx` (`created_at` ASC),
  INDEX `event_created_idx` (`event` ASC, `created_at` ASC),
  INDEX `user_id_idx` (`user_id` ASC))
ENGINE = InnoDB;
