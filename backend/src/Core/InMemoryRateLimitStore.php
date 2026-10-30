<?php

namespace App\Core;

/**
 * Compteurs gardés en mémoire, avec une horloge qu'on peut avancer à la main : pour les tests, sans base de données
 * ni attente réelle. Même contrat que MysqlRateLimitStore.
 */
class InMemoryRateLimitStore implements RateLimitStore
{
    /** @var array<string, array{hits:int, start:int}> */
    private array $buckets = [];

    /** @var callable(): int */
    private $clock;

    /** @param callable(): int|null $clock Renvoie l'heure en secondes (défaut : l'heure réelle) */
    public function __construct(?callable $clock = null)
    {
        $this->clock = $clock ?? fn(): int => time();
    }

    public function hit(string $bucket, int $windowSeconds): array
    {
        $now = ($this->clock)();
        $current = $this->buckets[$bucket] ?? null;

        if ($current === null || $now - $current['start'] >= $windowSeconds) {
            $this->buckets[$bucket] = ['hits' => 1, 'start' => $now];
        } else {
            $this->buckets[$bucket]['hits']++;
        }

        return $this->read($bucket, $windowSeconds, $now);
    }

    public function peek(string $bucket, int $windowSeconds): array
    {
        return $this->read($bucket, $windowSeconds, ($this->clock)());
    }

    public function clear(string $bucket): void
    {
        unset($this->buckets[$bucket]);
    }

    public function purge(): void
    {
        $now = ($this->clock)();
        foreach ($this->buckets as $bucket => $data) {
            if ($now - $data['start'] > 86400) {
                unset($this->buckets[$bucket]);
            }
        }
    }

    /** @return array{hits:int, retryAfter:int} */
    private function read(string $bucket, int $windowSeconds, int $now): array
    {
        $current = $this->buckets[$bucket] ?? null;

        if ($current === null || $now - $current['start'] >= $windowSeconds) {
            return ['hits' => 0, 'retryAfter' => 0];
        }

        return ['hits' => $current['hits'], 'retryAfter' => $current['start'] + $windowSeconds - $now];
    }
}
