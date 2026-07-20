<?php

namespace App\Services;

use App\Models\AdminKpiModel;

class AdminKpiService
{
    public function __construct(
        private AdminKpiModel $model = new AdminKpiModel()
    ) {}

    /**
     * Valide la période, calcule le total et formate
     */
    public function getSalesData(?string $range): array
    {
        $allowedRanges = ['day', 'week', 'month'];
        $safeRange = in_array($range, $allowedRanges, true) ? $range : 'month';

        try {
            $breakdown = $this->model->getSalesBreakdown($safeRange);

            // Calcul du total
            $totalSales = 0.0;
            $totalOrders = 0;
            foreach ($breakdown as &$row) {
                $row['total'] = (float) $row['total'];
                $totalSales += $row['total'];
                $totalOrders += (int) $row['order_count'];
            }

            return [
                'success'   => true,
                'code'      => 200,
                'data'      => [
                    'range'         => $safeRange,
                    'total_sales'   => round($totalSales, 2),
                    'total_orders'  => $totalOrders,
                    'breakdown'     => $breakdown
                ]
            ];
        } catch (\Exception $e) {
            error_log("AdminKpiService::getSalesData : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => 'Impossible de générer les statistiques de ventes.'
            ];
        }
    }
}
