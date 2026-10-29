<?php

namespace App\Core;

/**
 * Règles de validation d'un produit saisi dans l'administration.
 *
 * Les limites ci-dessous sont des limites MÉTIER, plus strictes que celles de la base de données
 * (nom : VARCHAR(255), prix : DECIMAL(10,2), stock : INT). Elles protègent d'une faute de frappe
 * (un zéro en trop) et doivent rester alignées avec frontend/src/constants/productLimits.js.
 */
class ProductPolicy
{
    public const NAME_MAX_LENGTH = 100;
    public const PRICE_MIN = 0.01;
    public const PRICE_MAX = 9999.99;
    public const STOCK_MAX = 9999;

    // Référence, conditionnement et poids (colonnes de products)
    public const SKU_MAX_LENGTH = 50;
    public const PACKAGING_TYPES = ['Pot', 'Plug', 'Bare root', 'Root ball'];
    public const POT_DIAMETER_MAX_CM = 200;
    public const VOLUME_MAX_L = 1000;
    public const WEIGHT_MAX_G = 100000;

    // Fiche botanique (colonnes de plants)
    public const FOLIAGES = ['Deciduous', 'Evergreen', 'Semi-evergreen'];
    public const DROUGHT_TOLERANCES = ['Low', 'Medium', 'High'];
    public const DIFFICULTIES = ['Beginner', 'Intermediate', 'Expert'];
    public const SHORT_TEXT_MAX_LENGTH = 100;
    public const CARE_TEXT_MAX_LENGTH = 2000;
    public const HEIGHT_MAX_CM = 3000;
    public const HARDINESS_MIN_C = -60;
    public const HARDINESS_MAX_C = 40;

    /**
     * @param array $data       Données reçues (JSON décodé)
     * @param bool  $isCreation true à la création : certains champs sont obligatoires.
     *                          À la modification (PATCH), seuls les champs présents sont vérifiés.
     * @return string[] Messages d'erreur (tableau vide si tout est valide)
     */
    public static function validate(array $data, bool $isCreation): array
    {
        $errors = [];

        if ($isCreation) {
            foreach (['subcategory_id', 'tax_id', 'name', 'price_tax_incl'] as $field) {
                if (!array_key_exists($field, $data) || self::isBlank($data[$field])) {
                    $errors[] = "Le champ '$field' est obligatoire.";
                }
            }
        }

        // Nom : on compte les CARACTÈRES (mb_strlen) : strlen compterait les octets, donc « é » pour 2.
        if (array_key_exists('name', $data)) {
            if (self::isBlank($data['name'])) {
                if (!$isCreation) {
                    $errors[] = "Le nom ne peut pas être vide.";
                }
            } elseif (!is_string($data['name'])) {
                $errors[] = "Le nom doit être du texte.";
            } elseif (mb_strlen(trim($data['name'])) > self::NAME_MAX_LENGTH) {
                $errors[] = "Le nom ne peut pas dépasser " . self::NAME_MAX_LENGTH . " caractères.";
            }
        }

        if (array_key_exists('price_tax_incl', $data)) {
            if (self::isBlank($data['price_tax_incl'])) {
                if (!$isCreation) {
                    $errors[] = "Le prix de vente ne peut pas être vide.";
                }
            } else {
                $error = self::checkAmount($data['price_tax_incl'], self::PRICE_MIN, 'Le prix de vente');
                if ($error !== null) {
                    $errors[] = $error;
                }
            }
        }

        // Prix d'achat : facultatif, mais s'il est renseigné il doit être raisonnable (0 autorisé)
        if (array_key_exists('purchase_price_tax_incl', $data) && !self::isBlank($data['purchase_price_tax_incl'])) {
            $error = self::checkAmount($data['purchase_price_tax_incl'], 0.0, "Le prix d'achat");
            if ($error !== null) {
                $errors[] = $error;
            }
        }

        if (array_key_exists('stock_quantity', $data) && !self::isBlank($data['stock_quantity'])) {
            $stock = filter_var($data['stock_quantity'], FILTER_VALIDATE_INT);
            if ($stock === false) {
                $errors[] = "Le stock doit être un nombre entier.";
            } elseif ($stock < 0 || $stock > self::STOCK_MAX) {
                $errors[] = "Le stock doit être compris entre 0 et " . number_format(self::STOCK_MAX, 0, ',', ' ') . ".";
            }
        }

        if (array_key_exists('subcategory_id', $data) && !self::isBlank($data['subcategory_id']) && !is_numeric($data['subcategory_id'])) {
            $errors[] = "L'identifiant de sous-catégorie est invalide.";
        }

        $errors = array_merge($errors, self::validateLogistics($data));

        if (array_key_exists('plant', $data) && $data['plant'] !== null) {
            if (!is_array($data['plant'])) {
                $errors[] = "Les données botaniques sont invalides.";
            } else {
                $errors = array_merge($errors, self::validateBotanical($data['plant']));
            }
        }

        return $errors;
    }

    /** Référence, conditionnement et poids : tous facultatifs, mais cohérents s'ils sont renseignés. */
    private static function validateLogistics(array $data): array
    {
        $errors = [];

        if (array_key_exists('sku', $data) && !self::isBlank($data['sku'])) {
            $sku = is_string($data['sku']) ? trim($data['sku']) : null;
            if ($sku === null || !preg_match('/^[A-Za-z0-9._-]+$/', $sku)) {
                $errors[] = "La référence (SKU) ne peut contenir que des lettres, des chiffres, des points, des tirets et des underscores.";
            } elseif (mb_strlen($sku) > self::SKU_MAX_LENGTH) {
                $errors[] = "La référence (SKU) ne peut pas dépasser " . self::SKU_MAX_LENGTH . " caractères.";
            }
        }

        $errors[] = self::checkChoice($data, 'packaging_type', self::PACKAGING_TYPES, 'Le type de conditionnement');
        $errors[] = self::checkInt($data, 'pot_diameter_cm', 1, self::POT_DIAMETER_MAX_CM, 'Le diamètre du pot', 'cm');
        $errors[] = self::checkDecimal($data, 'volume_l', 0.01, self::VOLUME_MAX_L, 'Le volume', 'L');
        $errors[] = self::checkInt($data, 'weight_g', 1, self::WEIGHT_MAX_G, 'Le poids', 'g');

        return array_values(array_filter($errors));
    }

    /** Fiche botanique : tous les champs sont facultatifs, mais cohérents s'ils sont renseignés. */
    private static function validateBotanical(array $plant): array
    {
        $errors = [];

        $errors[] = self::checkText($plant, 'family', self::SHORT_TEXT_MAX_LENGTH, 'La famille botanique');
        $errors[] = self::checkText($plant, 'cultivar', self::SHORT_TEXT_MAX_LENGTH, 'La variété');
        $errors[] = self::checkChoice($plant, 'foliage', self::FOLIAGES, 'Le type de feuillage');
        $errors[] = self::checkChoice($plant, 'drought_tolerance', self::DROUGHT_TOLERANCES, 'La tolérance à la sécheresse');
        $errors[] = self::checkChoice($plant, 'difficulty', self::DIFFICULTIES, "Le niveau de difficulté d'entretien");
        $errors[] = self::checkInt($plant, 'height_max_cm', 1, self::HEIGHT_MAX_CM, 'La hauteur à maturité', 'cm');
        $errors[] = self::checkInt($plant, 'hardiness_min_c', self::HARDINESS_MIN_C, self::HARDINESS_MAX_C, 'La rusticité', '°C');

        $errors[] = self::checkMonthPair($plant, 'bloom_start_month', 'bloom_end_month', 'La période de floraison');
        $errors[] = self::checkMonthPair($plant, 'harvest_start_month', 'harvest_end_month', 'La période de récolte');

        $errors[] = self::checkText($plant, 'care_pruning', self::CARE_TEXT_MAX_LENGTH, 'Le conseil de taille');
        $errors[] = self::checkText($plant, 'care_repotting', self::CARE_TEXT_MAX_LENGTH, 'Le conseil de rempotage');
        $errors[] = self::checkText($plant, 'care_pests_diseases', self::CARE_TEXT_MAX_LENGTH, 'Le conseil maladies et ravageurs');

        return array_values(array_filter($errors));
    }

    /** Vide ou absent. Contrairement à empty(), un 0 n'est PAS considéré comme vide (c'est une valeur à valider). */
    private static function isBlank(mixed $value): bool
    {
        return $value === null || (is_string($value) && trim($value) === '');
    }

    /** @return string|null Message d'erreur, ou null si le champ est absent, vide ou dans la liste */
    private static function checkChoice(array $data, string $field, array $allowed, string $label): ?string
    {
        if (!array_key_exists($field, $data) || self::isBlank($data[$field])) {
            return null;
        }

        return in_array($data[$field], $allowed, true) ? null : "$label n'est pas une valeur autorisée.";
    }

    /** Entier compris entre $min et $max. Un booléen est refusé : filter_var() accepterait true comme 1. */
    private static function checkInt(array $data, string $field, int $min, int $max, string $label, string $unit): ?string
    {
        if (!array_key_exists($field, $data) || self::isBlank($data[$field])) {
            return null;
        }

        $value = is_bool($data[$field]) ? false : filter_var($data[$field], FILTER_VALIDATE_INT);
        if ($value === false || $value < $min || $value > $max) {
            return "$label doit être un nombre entier compris entre $min et $max $unit.";
        }

        return null;
    }

    private static function checkDecimal(array $data, string $field, float $min, float $max, string $label, string $unit): ?string
    {
        if (!array_key_exists($field, $data) || self::isBlank($data[$field])) {
            return null;
        }

        if (!is_numeric($data[$field]) || (float) $data[$field] < $min || (float) $data[$field] > $max) {
            return "$label doit être compris entre " . number_format($min, 2, ',', ' ')
                . " et " . number_format($max, 0, ',', ' ') . " $unit.";
        }

        return null;
    }

    /** Texte limité en CARACTÈRES (mb_strlen), comme pour le nom. */
    private static function checkText(array $data, string $field, int $max, string $label): ?string
    {
        if (!array_key_exists($field, $data) || self::isBlank($data[$field])) {
            return null;
        }

        if (!is_string($data[$field])) {
            return "$label doit être du texte.";
        }

        return mb_strlen(trim($data[$field])) > $max ? "$label ne peut pas dépasser $max caractères." : null;
    }

    /**
     * Une période = mois de début + mois de fin (1 à 12). Le début peut être après la fin :
     * décembre → mars traverse le changement d'année.
     */
    private static function checkMonthPair(array $data, string $startField, string $endField, string $label): ?string
    {
        $hasStart = array_key_exists($startField, $data) && !self::isBlank($data[$startField]);
        $hasEnd   = array_key_exists($endField, $data) && !self::isBlank($data[$endField]);

        if ($hasStart !== $hasEnd) {
            return "$label : indiquez le mois de début et le mois de fin.";
        }

        if (!$hasStart) {
            return null;
        }

        foreach ([$data[$startField], $data[$endField]] as $month) {
            $value = is_bool($month) ? false : filter_var($month, FILTER_VALIDATE_INT);
            if ($value === false || $value < 1 || $value > 12) {
                return "$label : les mois doivent être compris entre 1 (janvier) et 12 (décembre).";
            }
        }

        return null;
    }

    /** @return string|null Message d'erreur, ou null si le montant est valide */
    private static function checkAmount(mixed $value, float $min, string $label): ?string
    {
        if (!is_numeric($value)) {
            return "$label doit être un nombre.";
        }

        $amount = (float) $value;
        if ($amount < $min || $amount > self::PRICE_MAX) {
            return "$label doit être compris entre " . number_format($min, 2, ',', ' ')
                . " € et " . number_format(self::PRICE_MAX, 2, ',', ' ') . " €.";
        }

        return null;
    }
}
