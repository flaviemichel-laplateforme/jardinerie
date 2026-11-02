<?php

namespace App\Core;

/**
 * Limitation des tentatives : décide si une action (connexion, inscription, « mot de passe oublié »…) est encore permise.
 *
 * Deux façons de compter, selon l'action :
 *  - attempt() : CHAQUE tentative compte (inscription, « mot de passe oublié »…, qui déclenchent un e-mail) ;
 *  - check() puis fail() / clear() : seuls les ÉCHECS comptent (connexion, changement de mot de passe) : un utilisateur qui
 *    se connecte normalement n'est jamais gêné, et une réussite remet le compteur à zéro.
 *
 * Si le magasin de compteurs est en panne (base injoignable, table absente), on laisse passer et on le note dans le journal du
 * serveur : la limitation ne doit jamais empêcher de se connecter.
 */
class RateLimiter
{
    public function __construct(
        private RateLimitStore $store,
        private bool $enabled = true
    ) {}

    /** Limiteur réel, branché sur la base de données. RATE_LIMIT_DISABLED=true n'est lu que hors production (tests locaux). */
    public static function fromEnvironment(): self
    {
        $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
        $disabled = !$isProduction && filter_var($_ENV['RATE_LIMIT_DISABLED'] ?? false, FILTER_VALIDATE_BOOLEAN);

        return new self(new MysqlRateLimitStore(), !$disabled);
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /** Clé du compteur : empreinte de « action|valeur ». Aucune adresse e-mail ni IP n'est jamais écrite en clair dans la table. */
    public static function bucket(string $action, string $value): string
    {
        return hash('sha256', $action . '|' . strtolower(trim($value)));
    }

    /**
     * Compte une tentative, puis dit si elle est permise.
     *
     * @return array{allowed:bool, retryAfter:int, justBlocked:bool} justBlocked : cette tentative est la première refusée de la fenêtre
     *         (pour ne journaliser qu'une fois le blocage, au lieu de chaque requête refusée)
     */
    public function attempt(string $action, string $value, int $max, int $windowSeconds): array
    {
        if (!$this->enabled) {
            return ['allowed' => true, 'retryAfter' => 0, 'justBlocked' => false];
        }

        try {
            $result = $this->store->hit(self::bucket($action, $value), $windowSeconds);
        } catch (\Throwable $e) {
            return $this->failOpen($e);
        }

        $this->maybePurge();

        return [
            'allowed'     => $result['hits'] <= $max,
            'retryAfter'  => $result['hits'] <= $max ? 0 : $result['retryAfter'],
            'justBlocked' => $result['hits'] === $max + 1,
        ];
    }

    /**
     * Le compteur d'échecs a-t-il atteint son seuil ? (ne compte rien)
     * @return array{blocked:bool, retryAfter:int}
     */
    public function check(string $action, string $value, int $max, int $windowSeconds): array
    {
        if (!$this->enabled) {
            return ['blocked' => false, 'retryAfter' => 0];
        }

        try {
            $result = $this->store->peek(self::bucket($action, $value), $windowSeconds);
        } catch (\Throwable $e) {
            $this->failOpen($e);

            return ['blocked' => false, 'retryAfter' => 0];
        }

        $blocked = $result['hits'] >= $max;

        return ['blocked' => $blocked, 'retryAfter' => $blocked ? $result['retryAfter'] : 0];
    }

    /**
     * Enregistre un échec.
     * @return array{locked:bool, justLocked:bool, retryAfter:int} justLocked : cet échec fait atteindre le seuil
     */
    public function fail(string $action, string $value, int $max, int $windowSeconds): array
    {
        if (!$this->enabled) {
            return ['locked' => false, 'justLocked' => false, 'retryAfter' => 0];
        }

        try {
            $result = $this->store->hit(self::bucket($action, $value), $windowSeconds);
        } catch (\Throwable $e) {
            $this->failOpen($e);

            return ['locked' => false, 'justLocked' => false, 'retryAfter' => 0];
        }

        $locked = $result['hits'] >= $max;

        return ['locked' => $locked, 'justLocked' => $result['hits'] === $max, 'retryAfter' => $locked ? $result['retryAfter'] : 0];
    }

    public function clear(string $action, string $value): void
    {
        if (!$this->enabled) {
            return;
        }

        try {
            $this->store->clear(self::bucket($action, $value));
        } catch (\Throwable $e) {
            $this->failOpen($e);
        }
    }

    /** @return array{allowed:bool, retryAfter:int, justBlocked:bool} */
    private function failOpen(\Throwable $e): array
    {
        error_log('Limitation des tentatives indisponible (les requêtes passent) : ' . $e->getMessage());

        return ['allowed' => true, 'retryAfter' => 0, 'justBlocked' => false];
    }

    /** Nettoyage des compteurs périmés : une fois sur cent, sans tâche planifiée. */
    private function maybePurge(): void
    {
        if (random_int(1, 100) !== 1) {
            return;
        }

        try {
            $this->store->purge();
        } catch (\Throwable $e) {
            error_log('Nettoyage des compteurs impossible : ' . $e->getMessage());
        }
    }
}
