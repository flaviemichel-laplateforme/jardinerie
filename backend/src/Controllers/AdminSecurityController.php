<?php

namespace App\Controllers;

use App\Core\DateFilter;
use App\Core\SecurityLog;
use App\Middlewares\AdminMiddleware;
use App\Models\SecurityEventModel;

class AdminSecurityController
{
    private const DEFAULT_LIMIT = 50;
    private const MAX_LIMIT = 200;

    public function __construct(
        private SecurityEventModel $model = new SecurityEventModel()
    ) {}

    /**
     * GET /api/admin/security-events
     * Journal de sécurité, du plus récent au plus ancien.
     * Filtres : event, user_id, email (haché ici : la table n'a jamais l'adresse en clair), from, to (dates AAAA-MM-JJ ou AAAA-MM-JJ HH:MM:SS).
     * Pagination : page, limit (50 par défaut, 200 au maximum). Même format que la liste des clients.
     */
    public function index(): void
    {
        AdminMiddleware::authenticate();

        $filters = [];

        $event = $_GET['event'] ?? null;
        if (is_string($event) && $event !== '') {
            if (!preg_match('/^[a-z_]{1,40}$/', $event)) {
                $this->respondInvalid("Filtre « event » invalide.");
                return;
            }
            $filters['event'] = $event;
        }

        $userId = $_GET['user_id'] ?? null;
        if (is_string($userId) && $userId !== '') {
            if (!ctype_digit($userId)) {
                $this->respondInvalid("Filtre « user_id » invalide.");
                return;
            }
            $filters['user_id'] = (int) $userId;
        }

        $email = $_GET['email'] ?? null;
        if (is_string($email) && trim($email) !== '') {
            $filters['email_hash'] = SecurityLog::hashEmail($email);
        }

        $dates = DateFilter::fromQuery($_GET);
        if ($dates['error'] !== null) {
            $this->respondInvalid($dates['error']);
            return;
        }
        $filters += $dates['filters'];

        $page   = max(1, (int) ($_GET['page'] ?? 1));
        $limit  = max(1, min(self::MAX_LIMIT, (int) ($_GET['limit'] ?? self::DEFAULT_LIMIT)));
        $offset = ($page - 1) * $limit;

        try {
            $total = $this->model->count($filters);
            $items = array_map(
                fn(array $row) => [...$row, 'details' => $row['details'] !== null ? json_decode($row['details'], true) : null],
                $this->model->list($filters, $limit, $offset)
            );
        } catch (\Throwable $e) {
            error_log('AdminSecurityController::index : ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de lire le journal de sécurité.'], JSON_UNESCAPED_UNICODE);
            return;
        }

        $totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'code'    => 200,
            'data'    => [
                'items'      => $items,
                'pagination' => [
                    'current_page' => $page,
                    'per_page'     => $limit,
                    'total_items'  => $total,
                    'total_pages'  => $totalPages,
                    'has_next'     => $page < $totalPages,
                    'has_prev'     => $page > 1,
                ],
            ],
        ], JSON_UNESCAPED_UNICODE);
    }

    private function respondInvalid(string $message): void
    {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    }
}
