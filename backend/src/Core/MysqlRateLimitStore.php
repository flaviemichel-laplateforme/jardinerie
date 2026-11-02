<?php

namespace App\Core;

use PDO;

/**
 * Compteurs de limitation gardés dans la table `rate_limits` (pas de Redis sur un hébergement Plesk).
 * Toutes les dates viennent de l'horloge de la base : le serveur web et la base n'ont pas à être synchronisés.
 */
class MysqlRateLimitStore implements RateLimitStore
{
    public function hit(string $bucket, int $windowSeconds): array
    {
        $db = Database::getConnection();

        // Une seule requête : crée le compteur, l'incrémente, ou le repart de 1 si sa fenêtre est terminée.
        // (Les deux « :window » portent des noms différents : les requêtes natives n'acceptent pas qu'un nom serve deux fois.)
        $sql = "INSERT INTO rate_limits (bucket, hits, window_start) VALUES (:bucket, 1, NOW())
                ON DUPLICATE KEY UPDATE
                    hits         = IF(window_start <= NOW() - INTERVAL :window_a SECOND, 1, hits + 1),
                    window_start = IF(window_start <= NOW() - INTERVAL :window_b SECOND, NOW(), window_start)";
        $stmt = $db->prepare($sql);
        $stmt->bindValue(':bucket', $bucket);
        $stmt->bindValue(':window_a', $windowSeconds, PDO::PARAM_INT);
        $stmt->bindValue(':window_b', $windowSeconds, PDO::PARAM_INT);
        $stmt->execute();

        return $this->read($bucket, $windowSeconds);
    }

    public function peek(string $bucket, int $windowSeconds): array
    {
        return $this->read($bucket, $windowSeconds);
    }

    public function clear(string $bucket): void
    {
        Database::getConnection()->prepare('DELETE FROM rate_limits WHERE bucket = :bucket')->execute([':bucket' => $bucket]);
    }

    public function purge(): void
    {
        Database::getConnection()->exec('DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL 1 DAY');
    }

    /** @return array{hits:int, retryAfter:int} */
    private function read(string $bucket, int $windowSeconds): array
    {
        $sql = "SELECT hits, GREATEST(0, :window_a - TIMESTAMPDIFF(SECOND, window_start, NOW())) AS retry_after
                FROM rate_limits
                WHERE bucket = :bucket AND window_start > NOW() - INTERVAL :window_b SECOND";
        $stmt = Database::getConnection()->prepare($sql);
        $stmt->bindValue(':bucket', $bucket);
        $stmt->bindValue(':window_a', $windowSeconds, PDO::PARAM_INT);
        $stmt->bindValue(':window_b', $windowSeconds, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? ['hits' => (int) $row['hits'], 'retryAfter' => (int) $row['retry_after']] : ['hits' => 0, 'retryAfter' => 0];
    }
}
