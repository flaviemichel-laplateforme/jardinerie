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

        return $errors;
    }

    /** Vide ou absent. Contrairement à empty(), un 0 n'est PAS considéré comme vide (c'est une valeur à valider). */
    private static function isBlank(mixed $value): bool
    {
        return $value === null || (is_string($value) && trim($value) === '');
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
