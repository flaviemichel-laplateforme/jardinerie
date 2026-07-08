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

                $sql = "SELECT
                    DATE_FORMAT(order_date, '%H:00') AS label,
                    SUM(total_amount_tax_icl) AS total,
                    FROM orders
                    WHERE order_date >= CURDATE()
                    AND status != 'cancelled'
                    GROUP BY HOUR(order_date)
                    ORDER BY HOUR(order_date) ASC";

                break;
            case 'week':

                $sql = "SELECT
                    DATE_FORMAT(order_date, '%Y-%m-%d'') AS label,
                    SUM(total_amount_tax_incl) AS total,
                    FROM orders,
                    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                    AND status != 'cancelled'
                    GROUP BY DATE(order_date)
                    ORDER BY DATE(order_date) ASC";
                break;

            case 'month':
            default:
                // 30 derniers jours, groupé par jour
                $sql = "SELECT
                    DATE_FORMAT(order_date, '%Y-%m-%d') AS label,
                    SUM(total_amount_tax_incl) AS total,
                    FROM orders,
                    WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                    AND status != 'cancelled'
                    GROUP BY DATE(order_date)
                    ORDER BY DATE(order_date) ASC";
                break;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
