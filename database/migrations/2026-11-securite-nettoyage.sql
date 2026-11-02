-- Nettoyage du lot S2 : supprime les jetons conservés en clair.
-- À lancer UNE SEULE FOIS, APRÈS avoir envoyé les fichiers PHP du lot S2 et vérifié que le site fonctionne
-- (connexion, « mot de passe oublié » et lien de vérification d'e-mail).
-- Pourquoi après : tant que l'ancien code est en place, il a besoin de la colonne `token` pour valider un lien.
-- Les jetons déjà envoyés par e-mail restent valables : le nouveau code les retrouve grâce à `token_hash`.

USE `flavie-michel_jardinerie_db`;

UPDATE `account_tokens` SET `token` = NULL;
