<?php

namespace App\Core;

/**
 * Correspondance entre les anciens critères « Sol … » (table criteria) et les nouvelles tables soil_types / soil_ph.
 *
 * Temporaire : l'ancien site public et l'ancien admin filtrent encore les sols par ces critères jusqu'à la bascule.
 * D'ici là, l'API tient les deux à jour (écriture double). Le jour de la bascule, 2026-11-sols-nettoyage.sql supprime ces
 * critères : les correspondances ci-dessous ne trouvent alors plus rien en base et il n'y a plus rien à faire.
 *
 * La correspondance se fait par NOM : une valeur renommée depuis l'admin n'a simplement plus d'ancien critère associé.
 */
final class SoilLegacy
{
    /** Nature du sol -> ancien critère */
    public const TYPE_TO_CRITERION = [
        'Argileux' => 'Sol argileux',
        'Sableux'  => 'Sol sableux',
        'Humifère' => 'Sol humifère',
        'Calcaire' => 'Sol calcaire',
        'Drainé'   => 'Sol drainé',
    ];

    /** pH du sol -> ancien critère (« Sol calcaire » sert aussi au pH alcalin) */
    public const PH_TO_CRITERION = [
        'Acide'   => 'Sol acide',
        'Neutre'  => 'Sol neutre',
        'Alcalin' => 'Sol calcaire',
    ];

    /** @return string[] Noms des 7 anciens critères de sol */
    public static function criterionNames(): array
    {
        return array_values(array_unique([...array_values(self::TYPE_TO_CRITERION), ...array_values(self::PH_TO_CRITERION)]));
    }

    public static function isLegacyCriterion(string $name): bool
    {
        return in_array($name, self::criterionNames(), true);
    }

    /**
     * Anciens critères à écrire pour ces sols.
     * @param string[] $typeNames
     * @param string[] $phNames
     * @return string[]
     */
    public static function criteriaFor(array $typeNames, array $phNames): array
    {
        $names = [];
        foreach ($typeNames as $name) {
            if (isset(self::TYPE_TO_CRITERION[$name])) {
                $names[] = self::TYPE_TO_CRITERION[$name];
            }
        }
        foreach ($phNames as $name) {
            if (isset(self::PH_TO_CRITERION[$name])) {
                $names[] = self::PH_TO_CRITERION[$name];
            }
        }

        return array_values(array_unique($names));
    }

    /**
     * Sols déduits d'anciens critères (requête de l'ancien admin, qui ne connaît que les critères).
     * « Sol calcaire » donne la nature Calcaire ET le pH Alcalin, comme la migration.
     * @param string[] $criterionNames
     * @return array{types: string[], ph: string[]}
     */
    public static function soilsFrom(array $criterionNames): array
    {
        return [
            'types' => array_values(array_keys(array_intersect(self::TYPE_TO_CRITERION, $criterionNames))),
            'ph'    => array_values(array_keys(array_intersect(self::PH_TO_CRITERION, $criterionNames))),
        ];
    }
}
