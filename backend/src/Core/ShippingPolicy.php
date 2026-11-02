<?php

namespace App\Core;

/**
 * La règle de livraison, écrite à UN seul endroit : gratuite dès 50 € d'articles (TTC), sinon 7,90 €.
 * Utilisée par le paiement (montant demandé à Stripe), la commande enregistrée, l'e-mail de confirmation et le résumé du panier :
 * ce que le client voit, ce qu'il paie et ce qui est enregistré ne peuvent plus diverger.
 *
 * Tout se calcule en CENTIMES (entiers) : les nombres décimaux d'un langage informatique se trompent sur des sommes comme
 * 0,1 + 0,2, ce qui est inacceptable pour un seuil à 50,00 € ou un montant débité sur une carte.
 */
class ShippingPolicy
{
    public const FREE_THRESHOLD_CENTS = 5000;
    public const COST_CENTS = 790;

    /** Frais de livraison, en centimes, pour un total d'articles en centimes. Panier vide : rien à livrer, rien à payer. */
    public static function costCents(int $itemsTotalCents): int
    {
        if ($itemsTotalCents <= 0) {
            return 0;
        }

        return $itemsTotalCents >= self::FREE_THRESHOLD_CENTS ? 0 : self::COST_CENTS;
    }

    /** Même chose en euros (pour les affichages et les colonnes DECIMAL de la base). */
    public static function cost(float $itemsTotal): float
    {
        return self::costCents((int) round($itemsTotal * 100)) / 100;
    }

    /** Euros -> centimes sans erreur d'arrondi. */
    public static function toCents(float $euros): int
    {
        return (int) round($euros * 100);
    }
}
