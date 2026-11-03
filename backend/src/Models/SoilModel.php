<?php

namespace App\Models;

use App\Core\Database;
use App\Core\SoilLegacy;
use PDO;

/**
 * Nature du sol (soil_types) et pH du sol (soil_ph) : deux listes de même forme, et leurs liens avec les plantes.
 * Le paramètre $kind choisit la liste : 'type' ou 'ph' (jamais une valeur venue de la requête : voir TABLES).
 */
class SoilModel
{
    /** Tables et colonnes de chaque liste : seules ces valeurs fixes entrent dans le SQL. */
    private const TABLES = [
        'type' => ['table' => 'soil_types', 'link' => 'plant_soil_type', 'column' => 'soil_type_id'],
        'ph'   => ['table' => 'soil_ph',    'link' => 'plant_soil_ph',   'column' => 'soil_ph_id'],
    ];

    /** @return list<array{id:int, name:string, plant_count:int}> par ordre alphabétique */
    public function all(string $kind): array
    {
        ['table' => $table, 'link' => $link, 'column' => $column] = self::TABLES[$kind];

        $rows = Database::getConnection()->query(
            "SELECT s.id, s.name, (SELECT COUNT(*) FROM $link l WHERE l.$column = s.id) AS plant_count
             FROM $table s ORDER BY s.name ASC"
        )->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn(array $row) => ['id' => (int) $row['id'], 'name' => $row['name'], 'plant_count' => (int) $row['plant_count']], $rows);
    }

    /** @return array{id:int, name:string, plant_count:int}|null */
    public function find(string $kind, int $id): ?array
    {
        foreach ($this->all($kind) as $row) {
            if ($row['id'] === $id) {
                return $row;
            }
        }

        return null;
    }

    /** Un autre élément de la liste porte-t-il déjà ce nom (sans tenir compte des majuscules) ? */
    public function nameTaken(string $kind, string $name, ?int $exceptId = null): bool
    {
        $table = self::TABLES[$kind]['table'];
        $stmt = Database::getConnection()->prepare("SELECT COUNT(*) FROM $table WHERE LOWER(name) = LOWER(:name) AND id <> :except");
        $stmt->execute([':name' => $name, ':except' => $exceptId ?? 0]);

        return (int) $stmt->fetchColumn() > 0;
    }

    public function create(string $kind, string $name): int
    {
        $db = Database::getConnection();
        $db->prepare('INSERT INTO ' . self::TABLES[$kind]['table'] . ' (name) VALUES (:name)')->execute([':name' => $name]);

        return (int) $db->lastInsertId();
    }

    public function rename(string $kind, int $id, string $name): void
    {
        Database::getConnection()->prepare('UPDATE ' . self::TABLES[$kind]['table'] . ' SET name = :name WHERE id = :id')
            ->execute([':name' => $name, ':id' => $id]);
    }

    public function delete(string $kind, int $id): void
    {
        Database::getConnection()->prepare('DELETE FROM ' . self::TABLES[$kind]['table'] . ' WHERE id = :id')->execute([':id' => $id]);
    }

    /**
     * Identifiants inconnus parmi ceux donnés.
     * @param int[] $ids
     * @return int[]
     */
    public function unknownIds(string $kind, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        $known = array_column($this->all($kind), 'id');

        return array_values(array_diff($ids, $known));
    }

    // ------------------------------------------------------------------ liens avec une plante

    /** @return int[] */
    public function idsForPlant(string $kind, int $plantId): array
    {
        ['link' => $link, 'column' => $column] = self::TABLES[$kind];
        $stmt = Database::getConnection()->prepare("SELECT $column FROM $link WHERE plant_id = :plant_id ORDER BY $column");
        $stmt->execute([':plant_id' => $plantId]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /** @return list<array{id:int, label:string}> pour la fiche produit publique */
    public function labelsForPlant(string $kind, int $plantId): array
    {
        ['table' => $table, 'link' => $link, 'column' => $column] = self::TABLES[$kind];
        $stmt = Database::getConnection()->prepare(
            "SELECT s.id, s.name AS label FROM $link l INNER JOIN $table s ON s.id = l.$column WHERE l.plant_id = :plant_id ORDER BY s.name"
        );
        $stmt->execute([':plant_id' => $plantId]);

        return array_map(fn(array $row) => ['id' => (int) $row['id'], 'label' => $row['label']], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Remplace les sols d'une plante ET ses critères, en tenant à jour les anciens critères « Sol … » (écriture double, voir SoilLegacy).
     * À appeler dans la transaction de l'enregistrement du produit.
     *
     * @param int[]      $criteriaIds critères envoyés (les anciens critères de sol qu'ils contiennent sont recalculés)
     * @param int[]|null $typeIds     nature du sol ; null = requête de l'ancien admin : déduite des anciens critères envoyés
     * @param int[]|null $phIds       pH du sol ; idem
     */
    public function syncPlant(PDO $db, int $plantId, array $criteriaIds, ?array $typeIds, ?array $phIds): void
    {
        $legacy = $this->legacyCriteria($db); // nom => id des anciens critères de sol encore en base

        if ($typeIds === null || $phIds === null) {
            $sentNames = array_keys(array_intersect($legacy, $criteriaIds));
            $derived   = SoilLegacy::soilsFrom($sentNames);
            $typeIds ??= $this->idsByName($db, 'type', $derived['types']);
            $phIds   ??= $this->idsByName($db, 'ph', $derived['ph']);
        }

        // Critères = critères « ordinaires » envoyés + anciens critères correspondant aux sols choisis
        $legacyNames = SoilLegacy::criteriaFor($this->namesByIds($db, 'type', $typeIds), $this->namesByIds($db, 'ph', $phIds));
        $criteria = array_values(array_unique([
            ...array_diff($criteriaIds, array_values($legacy)),
            ...array_values(array_intersect_key($legacy, array_flip($legacyNames))),
        ]));

        $db->prepare('DELETE FROM plant_criterion WHERE plant_id = :plant_id')->execute([':plant_id' => $plantId]);
        $insert = $db->prepare('INSERT INTO plant_criterion (plant_id, criterion_id) VALUES (:plant_id, :criterion_id)');
        foreach ($criteria as $criterionId) {
            $insert->execute([':plant_id' => $plantId, ':criterion_id' => $criterionId]);
        }

        foreach (['type' => $typeIds, 'ph' => $phIds] as $kind => $ids) {
            ['link' => $link, 'column' => $column] = self::TABLES[$kind];
            $db->prepare("DELETE FROM $link WHERE plant_id = :plant_id")->execute([':plant_id' => $plantId]);
            $insertLink = $db->prepare("INSERT INTO $link (plant_id, $column) VALUES (:plant_id, :id)");
            foreach (array_unique($ids) as $id) {
                $insertLink->execute([':plant_id' => $plantId, ':id' => $id]);
            }
        }
    }

    /** @return array<string, int> nom => id des anciens critères de sol présents en base */
    public function legacyCriteria(PDO $db): array
    {
        $names = SoilLegacy::criterionNames();
        $stmt  = $db->prepare('SELECT name, id FROM criteria WHERE name IN (' . implode(',', array_fill(0, count($names), '?')) . ')');
        $stmt->execute($names);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_KEY_PAIR));
    }

    /**
     * @param string[] $names
     * @return int[]
     */
    private function idsByName(PDO $db, string $kind, array $names): array
    {
        if ($names === []) {
            return [];
        }
        $stmt = $db->prepare('SELECT id FROM ' . self::TABLES[$kind]['table'] . ' WHERE name IN (' . implode(',', array_fill(0, count($names), '?')) . ')');
        $stmt->execute(array_values($names));

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    /**
     * @param int[] $ids
     * @return string[]
     */
    private function namesByIds(PDO $db, string $kind, array $ids): array
    {
        if ($ids === []) {
            return [];
        }
        $stmt = $db->prepare('SELECT name FROM ' . self::TABLES[$kind]['table'] . ' WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
        $stmt->execute(array_values($ids));

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
