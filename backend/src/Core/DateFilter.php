<?php

namespace App\Core;

/**
 * Filtres de dates des listes admin (journal de sécurité, mouvements de stock…) : « from » et « to » au format
 * AAAA-MM-JJ ou AAAA-MM-JJ HH:MM:SS. Une date de fin sans heure inclut toute la journée.
 */
final class DateFilter
{
    /** « 2026-11-03 » ou « 2026-11-03 14:30:00 » -> « 2026-11-03 14:30:00 », ou null si la date n'existe pas (30 février…). */
    public static function parse(string $value): ?string
    {
        foreach (['Y-m-d H:i:s', 'Y-m-d'] as $format) {
            $date = \DateTimeImmutable::createFromFormat('!' . $format, $value);
            if ($date !== false && $date->format($format) === $value) {
                return $date->format('Y-m-d H:i:s');
            }
        }

        return null;
    }

    /**
     * Lit « from » et « to » dans les paramètres de la requête.
     * @param array<string, mixed> $query
     * @return array{filters: array<string, string>, error: ?string}
     */
    public static function fromQuery(array $query): array
    {
        $filters = [];

        foreach (['from', 'to'] as $key) {
            $value = $query[$key] ?? null;
            if (!is_string($value) || $value === '') {
                continue;
            }

            $date = self::parse($value);
            if ($date === null) {
                return ['filters' => [], 'error' => "Filtre « $key » invalide (AAAA-MM-JJ attendu)."];
            }

            // « to=2026-11-03 » doit inclure toute la journée du 3
            $filters[$key] = $key === 'to' && strlen($value) === 10 ? substr($date, 0, 10) . ' 23:59:59' : $date;
        }

        return ['filters' => $filters, 'error' => null];
    }
}
