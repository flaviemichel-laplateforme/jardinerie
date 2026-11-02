<?php

namespace App\Core;

/**
 * Où sont gardés les compteurs de la limitation des tentatives.
 *
 * Un compteur (« seau ») compte des événements dans une fenêtre de temps FIXE : à la première tentative, la fenêtre s'ouvre ;
 * elle se referme toute seule après $windowSeconds, et le compteur repart de zéro.
 * La production utilise MySQL (MysqlRateLimitStore) ; les tests utilisent une version en mémoire à horloge simulée.
 */
interface RateLimitStore
{
    /**
     * Compte une tentative de plus.
     * @return array{hits:int, retryAfter:int} Tentatives dans la fenêtre en cours, et secondes avant la fin de cette fenêtre
     */
    public function hit(string $bucket, int $windowSeconds): array;

    /**
     * Lit un compteur sans le modifier (0 tentative si la fenêtre est terminée).
     * @return array{hits:int, retryAfter:int}
     */
    public function peek(string $bucket, int $windowSeconds): array;

    /** Remet un compteur à zéro (après une connexion réussie). */
    public function clear(string $bucket): void;

    /** Supprime les compteurs dont la fenêtre est terminée depuis longtemps. */
    public function purge(): void;
}
