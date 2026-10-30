<?php

namespace App\Controllers;

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

        foreach (['from', 'to'] as $key) {
            $value = $_GET[$key] ?? null;
            if (is_string($value) && $value !== '') {
                $date = $this->parseDate($value);
                if ($date === null) {
                    $this->respondInvalid("Filtre « $key » invalide (AAAA-MM-JJ attendu).");
                    return;
                }
                // « to=2026-11-03 » doit inclure toute la journée du 3
                $filters[$key] = $key === 'to' && strlen($value) === 10 ? substr($date, 0, 10) . ' 23:59:59' : $date;
            }
        }

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

    /** « 2026-11-03 » ou « 2026-11-03 14:30:00 » -> « 2026-11-03 14:30:00 », ou null si la date n'existe pas. */
    private function parseDate(string $value): ?string
    {
        foreach (['Y-m-d H:i:s', 'Y-m-d'] as $format) {
            $date = \DateTimeImmutable::createFromFormat('!' . $format, $value);
            if ($date !== false && $date->format($format) === $value) {
                return $date->format('Y-m-d H:i:s');
            }
        }

        return null;
    }

    private function respondInvalid(string $message): void
    {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    }
}
