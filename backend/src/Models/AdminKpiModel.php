<?php

namespace App\Models;

use App\Core\Database;

class AdminKpiModel
{
    /**
     * Retourne les données brutes du CA groupées par jour ou par heure
     */
    public function getSalesBreakdown(string $range): array
    {
        $db = Database::getConnection();

        switch ($range) {
            case 'day':
                // Aujourd'hui : on groupe strictement par l'alias 'label'
                $sql = "SELECT
                            DATE_FORMAT(order_date, '%H:00') AS label,
                            COALESCE(SUM(total_amount_tax_incl + shipping_cost_tax_incl), 0) AS total,
                            COUNT(*) AS order_count 
                        FROM orders
                        WHERE order_date >= CURDATE()
                          AND status != 'cancelled'
                        GROUP BY label
                        ORDER BY label ASC";
                break;

            case 'week':
                // 7 derniers jours : on groupe strictement par l'alias 'label'
                $sql = "SELECT
                            DATE_FORMAT(order_date, '%Y-%m-%d') AS label,
                            COALESCE(SUM(total_amount_tax_incl + shipping_cost_tax_incl), 0) AS total,
                            COUNT(*) AS order_count 
                        FROM orders
                        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                          AND status != 'cancelled'
                        GROUP BY label
                        ORDER BY label ASC";
                break;

            case 'month':
            default:
                // 30 derniers jours : on groupe strictement par l'alias 'label'
                $sql = "SELECT
                            DATE_FORMAT(order_date, '%Y-%m-%d') AS label,
                            COALESCE(SUM(total_amount_tax_incl + shipping_cost_tax_incl), 0) AS total,
                            COUNT(*) AS order_count 
                        FROM orders
                        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                          AND status != 'cancelled'
                        GROUP BY label
                        ORDER BY label ASC";
                break;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
