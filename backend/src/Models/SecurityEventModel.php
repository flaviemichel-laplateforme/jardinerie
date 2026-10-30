<?php

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Journal de sécurité (table `security_events`). Les adresses e-mail n'y sont jamais en clair : seulement leur empreinte.
 */
class SecurityEventModel
{
    /** Durée de conservation des événements. */
    public const RETENTION_MONTHS = 12;

    /** @param array{user_id:?int, email_hash:?string, event:string, ip:?string, user_agent:?string, details:?string} $row */
    public function insert(array $row): void
    {
        $sql = "INSERT INTO security_events (user_id, email_hash, event, ip, user_agent, details)
                VALUES (:user_id, :email_hash, :event, :ip, :user_agent, :details)";

        Database::getConnection()->prepare($sql)->execute([
            ':user_id'    => $row['user_id'],
            ':email_hash' => $row['email_hash'],
            ':event'      => $row['event'],
            ':ip'         => $row['ip'],
            ':user_agent' => $row['user_agent'],
            ':details'    => $row['details'],
        ]);
    }

    /**
     * @param array{event?:?string, user_id?:?int, email_hash?:?string, from?:?string, to?:?string} $filters
     * @return array<int, array<string, mixed>>
     */
    public function list(array $filters, int $limit, int $offset): array
    {
        [$where, $params] = $this->buildWhere($filters);

        $sql = "SELECT id, user_id, email_hash, event, ip, user_agent, details, created_at
                FROM security_events $where
                ORDER BY created_at DESC, id DESC
                LIMIT :limit OFFSET :offset";
        $stmt = Database::getConnection()->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /** @param array{event?:?string, user_id?:?int, email_hash?:?string, from?:?string, to?:?string} $filters */
    public function count(array $filters): int
    {
        [$where, $params] = $this->buildWhere($filters);

        $stmt = Database::getConnection()->prepare("SELECT COUNT(*) FROM security_events $where");
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    /** Supprime les événements plus vieux que la durée de conservation. */
    public function purgeExpired(): void
    {
        Database::getConnection()->exec('DELETE FROM security_events WHERE created_at < NOW() - INTERVAL ' . self::RETENTION_MONTHS . ' MONTH');
    }

    /**
     * Droit à l'oubli : efface l'IP, l'agent et les détails des événements d'un compte. Les événements eux-mêmes restent
     * (date et type), sans donnée personnelle. Les tentatives de connexion ratées n'ont pas d'identifiant de compte :
     * on les retrouve avec l'empreinte de l'adresse que le compte avait avant d'être anonymisé.
     */
    public function scrubUser(int $userId, ?string $emailHash = null): void
    {
        $sql = 'UPDATE security_events SET ip = NULL, user_agent = NULL, details = NULL WHERE user_id = :user_id';
        $params = [':user_id' => $userId];

        if ($emailHash !== null) {
            $sql .= ' OR email_hash = :email_hash';
            $params[':email_hash'] = $emailHash;
        }

        Database::getConnection()->prepare($sql)->execute($params);
    }

    /** @return array{0:string, 1:array<string, mixed>} Clause WHERE et ses paramètres */
    private function buildWhere(array $filters): array
    {
        $conditions = [];
        $params = [];

        if (!empty($filters['event'])) {
            $conditions[] = 'event = :event';
            $params[':event'] = $filters['event'];
        }
        if (!empty($filters['user_id'])) {
            $conditions[] = 'user_id = :user_id';
            $params[':user_id'] = (int) $filters['user_id'];
        }
        if (!empty($filters['email_hash'])) {
            $conditions[] = 'email_hash = :email_hash';
            $params[':email_hash'] = $filters['email_hash'];
        }
        if (!empty($filters['from'])) {
            $conditions[] = 'created_at >= :from';
            $params[':from'] = $filters['from'];
        }
        if (!empty($filters['to'])) {
            $conditions[] = 'created_at <= :to';
            $params[':to'] = $filters['to'];
        }

        return [$conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions), $params];
    }
}
