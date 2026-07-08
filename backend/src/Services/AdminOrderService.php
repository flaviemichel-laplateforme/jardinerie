<?php

namespace App\Services;

use App\Models\AdminOrderModel;

class AdminOrderService
{
    public function __construct(
        private AdminOrderModel $model = new AdminOrderModel()
    ) {}

    /**
     * Pilote la récupération des commandes en calculant les métadonnées de pagination.
     */
    public function getOrders(?string $status, int $page = 1, int $limit = 10): array
    {
        // 1. Liste blanche pour sécuriser le paramètre statut
        $validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'all'];
        if ($status && !in_array($status, $validStatuses, true)) {
            $status = 'all';
        }

        // 2. Sécurisation des entrées numériques pour éviter les divisions par zéro ou valeurs négatives
        $page = max(1, $page);
        $limit = max(1, min(100, $limit)); // On capte à 100 maximum par sécurité

        // Formule de décalage mathématique
        $offset = ($page - 1) * $limit;

        try {
            // 3. Collecte des données via le modèle
            $totalItems = $this->model->countOrders($status);
            $orders = $this->model->getOrdersPaginated($status, $limit, $offset);

            // 4. Calcul du nombre total de pages
            $totalPages = $totalItems > 0 ? (int) ceil($totalItems / $limit) : 1;

            // 5. Retour standardisé (Pattern Result) contenant les métadonnées pour le Front-end
            return [
                'success' => true,
                'code'    => 200,
                'data'    => [
                    'items'      => $orders,
                    'pagination' => [
                        'current_page' => $page,
                        'per_page'     => $limit,
                        'total_items'  => $totalItems,
                        'total_pages'  => $totalPages,
                        'has_next'     => $page < $totalPages,
                        'has_prev'     => $page > 1
                    ]
                ]
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AdminOrderService : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible de récupérer la liste des commandes."
            ];
        }
    }
}
