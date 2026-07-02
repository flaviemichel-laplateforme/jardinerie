<?php

namespace App\Services;

use Resend;

class EmailService
{
    private \Resend\Client $client;
    private string $fromEmail;

    public function __construct()
    {
        $this->client    = Resend::client($_ENV['RESEND_API_KEY']);
        $this->fromEmail = $_ENV['RESEND_FROM_EMAIL'] ?? 'onboarding@resend.dev';
    }

    /**
     * Envoie un email de confirmation de commande au client.
     * L'échec d'envoi ne bloque PAS la création de la commande —
     * la commande existe déjà en base à ce stade.
     */
    public function sendOrderConfirmation(
        string $toEmail,
        string $firstName,
        string $orderReference,
        array  $cartItems,
        float  $total,
        float  $shippingCost
    ): bool {
        try {
            $html = $this->buildOrderEmail(
                $firstName,
                $orderReference,
                $cartItems,
                $total,
                $shippingCost
            );

            $this->client->emails->send([
                'from'    => "La Jardinerie <{$this->fromEmail}>",
                'to'      => [$toEmail],
                'subject' => "Confirmation de commande {$orderReference} — La Jardinerie",
                'html'    => $html,
            ]);

            return true;
        } catch (\Exception $e) {
            // On logue l'erreur mais on ne la propage pas —
            // la commande est déjà créée, l'email est secondaire.
            error_log("EMAIL ERROR [{$orderReference}]: " . $e->getMessage());
            error_log("EMAIL ERROR TRACE: " . $e->getTraceAsString());
            return false;
        }
    }

    /**
     * Construit le HTML de l'email de confirmation.
     * Template simple mais professionnel, aux couleurs de la jardinerie.
     */
    private function buildOrderEmail(
        string $firstName,
        string $orderReference,
        array  $cartItems,
        float  $total,
        float  $shippingCost
    ): string {
        // Construire les lignes du tableau des articles
        $itemsRows = '';
        foreach ($cartItems as $item) {
            $lineTotal = number_format($item['line_total'], 2, ',', ' ');
            $unitPrice = number_format($item['unit_price'], 2, ',', ' ');
            $itemsRows .= "
                <tr>
                    <td style='padding: 12px; border-bottom: 1px solid #eee;'>
                        {$item['name']}
                    </td>
                    <td style='padding: 12px; border-bottom: 1px solid #eee; text-align: center;'>
                        {$item['quantity']}
                    </td>
                    <td style='padding: 12px; border-bottom: 1px solid #eee; text-align: right;'>
                        {$unitPrice} €
                    </td>
                    <td style='padding: 12px; border-bottom: 1px solid #eee; text-align: right;'>
                        <strong>{$lineTotal} €</strong>
                    </td>
                </tr>
            ";
        }

        $totalFormatted    = number_format($total, 2, ',', ' ');
        $shippingFormatted = $shippingCost > 0
            ? number_format($shippingCost, 2, ',', ' ') . ' €'
            : 'Gratuite';
        $grandTotal        = number_format($total + $shippingCost, 2, ',', ' ');

        return "
        <!DOCTYPE html>
        <html lang='fr'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='margin: 0; padding: 0; background-color: #f5f5f0; font-family: Arial, sans-serif;'>

            <div style='max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>

                <!-- En-tête -->
                <div style='background-color: #027148; padding: 32px; text-align: center;'>
                    <h1 style='color: white; margin: 0; font-size: 24px;'>La Jardinerie</h1>
                    <p style='color: #a8d5b5; margin: 8px 0 0; font-size: 14px;'>Plantes & Produits de jardinage</p>
                </div>

                <!-- Corps -->
                <div style='padding: 32px;'>
                    <h2 style='color: #1a2e1a; margin-top: 0;'>
                        Merci pour votre commande, {$firstName} ! 🌱
                    </h2>

                    <p style='color: #555; line-height: 1.6;'>
                        Votre commande <strong>{$orderReference}</strong> a bien été reçue et votre paiement a été confirmé.
                        Nous préparons votre colis avec soin.
                    </p>

                    <!-- Tableau des articles -->
                    <table style='width: 100%; border-collapse: collapse; margin: 24px 0;'>
                        <thead>
                            <tr style='background-color: #EDF0E2;'>
                                <th style='padding: 12px; text-align: left; color: #027148; font-size: 13px;'>Article</th>
                                <th style='padding: 12px; text-align: center; color: #027148; font-size: 13px;'>Qté</th>
                                <th style='padding: 12px; text-align: right; color: #027148; font-size: 13px;'>Prix unitaire</th>
                                <th style='padding: 12px; text-align: right; color: #027148; font-size: 13px;'>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$itemsRows}
                        </tbody>
                    </table>

                    <!-- Récapitulatif des totaux -->
                    <div style='background: #f9f9f6; border-radius: 8px; padding: 16px; margin-top: 16px;'>
                        <div style='display: flex; justify-content: space-between; margin-bottom: 8px; color: #555;'>
                            <span>Sous-total TTC</span>
                            <span>{$totalFormatted} €</span>
                        </div>
                        <div style='display: flex; justify-content: space-between; margin-bottom: 12px; color: #555;'>
                            <span>Livraison (Colissimo)</span>
                            <span>{$shippingFormatted}</span>
                        </div>
                        <div style='display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #027148; border-top: 2px solid #027148; padding-top: 12px;'>
                            <span>Total payé </span>
                            <span>{$grandTotal} €</span>
                        </div>
                    </div>

                    <p style='color: #555; line-height: 1.6; margin-top: 24px;'>
                        Vous recevrez un email dès que votre colis sera expédié.
                        Pour toute question, contactez-nous à
                        <a href='mailto:contact@la-jardinerie.fr' style='color: #027148;'>contact@la-jardinerie.fr</a>.
                    </p>
                </div>

                <!-- Pied de page -->
                <div style='background-color: #EDF0E2; padding: 20px; text-align: center;'>
                    <p style='color: #666; font-size: 12px; margin: 0;'>
                        © 2026 La Jardinerie — Tous droits réservés
                    </p>
                    <p style='color: #888; font-size: 11px; margin: 8px 0 0;'>
                        Référence commande : {$orderReference}
                    </p>
                </div>

            </div>

        </body>
        </html>
        ";
    }
}
