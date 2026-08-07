<?php

namespace App\Services;

use App\Models\AdminClientModel;
use App\Models\AddressModel;
use App\Models\OrderModel;
use App\Models\UserModel;
use App\Models\AccountTokenModel;

class AdminClientService
{
    public function __construct(
        private AdminClientModel  $model        = new AdminClientModel(),
        private AddressModel      $addressModel = new AddressModel(),
        private OrderModel        $orderModel   = new OrderModel(),
        private UserModel         $userModel    = new UserModel(),
        private AccountTokenModel $tokenModel   = new AccountTokenModel(),
        private EmailService      $emailService = new EmailService()
    ) {}

    /**
     * Liste paginée des clients, avec recherche et filtre par rôle.
     */
    public function getClients(?string $search, ?string $role, int $page = 1, int $limit = 10): array
    {
        $page  = max(1, $page);
        $limit = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        try {
            $totalItems = $this->model->countClients($search, $role);
            $clients    = $this->model->getClientsPaginated($search, $role, $limit, $offset);
            $totalPages = $totalItems > 0 ? (int) ceil($totalItems / $limit) : 1;

            return [
                'success' => true,
                'code'    => 200,
                'data'    => [
                    'items'      => $clients,
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
            error_log("Erreur dans AdminClientService::getClients : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible de récupérer la liste des clients."
            ];
        }
    }

    /**
     * Détail complet d'un client : identité, adresses, historique de commandes.
     */
    public function getClientDetails(int $id): array
    {
        try {
            $client = $this->model->getById($id);

            if (!$client) {
                return [
                    'success' => false,
                    'code'    => 404,
                    'message' => "Client introuvable."
                ];
            }

            return [
                'success' => true,
                'code'    => 200,
                'data'    => [
                    'client'    => $client,
                    'addresses' => $this->addressModel->findByUserId($id),
                    'orders'    => $this->orderModel->findByUserId($id),
                ]
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AdminClientService::getClientDetails : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible de récupérer le détail du client."
            ];
        }
    }

    /**
     * Modifie le rôle d'un client, avec protections de sécurité.
     */
    public function updateRole(int $id, ?string $newRole, int $currentAdminId): array
    {
        $validRoles = ['customer', 'admin'];

        if (!$newRole || !in_array($newRole, $validRoles, true)) {
            return [
                'success' => false,
                'code'    => 400,
                'message' => "Rôle invalide. Valeurs autorisées : " . implode(', ', $validRoles)
            ];
        }

        $client = $this->model->getById($id);

        if (!$client) {
            return [
                'success' => false,
                'code'    => 404,
                'message' => "Client introuvable."
            ];
        }

        if ($id === $currentAdminId) {
            return [
                'success' => false,
                'code'    => 403,
                'message' => "Vous ne pouvez pas modifier votre propre rôle."
            ];
        }

        if ($client['role'] === 'admin' && $newRole !== 'admin' && $this->model->countAdmins() <= 1) {
            return [
                'success' => false,
                'code'    => 403,
                'message' => "Impossible de retirer les droits du dernier administrateur."
            ];
        }

        try {
            $this->model->updateRole($id, $newRole);
            return [
                'success' => true,
                'code'    => 200,
                'message' => "Rôle mis à jour avec succès."
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AdminClientService::updateRole : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible de mettre à jour le rôle."
            ];
        }
    }

    /**
     * Anonymise un compte client, à la demande de l'admin (droit à l'oubli).
     */
    public function anonymizeClient(int $id, int $currentAdminId): array
    {
        $client = $this->model->getById($id);

        if (!$client) {
            return [
                'success' => false,
                'code'    => 404,
                'message' => "Client introuvable."
            ];
        }

        if ($id === $currentAdminId) {
            return [
                'success' => false,
                'code'    => 403,
                'message' => "Vous ne pouvez pas anonymiser votre propre compte."
            ];
        }

        if ($client['role'] === 'admin' && $this->model->countAdmins() <= 1) {
            return [
                'success' => false,
                'code'    => 403,
                'message' => "Impossible d'anonymiser le dernier administrateur."
            ];
        }

        try {
            $this->userModel->anonymize($id);
            return [
                'success' => true,
                'code'    => 200,
                'message' => "Le compte a été anonymisé avec succès."
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AdminClientService::anonymizeClient : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible d'anonymiser ce compte."
            ];
        }
    }

    /**
     * Génère un jeton de réinitialisation et envoie le lien par email.
     */
    public function sendPasswordResetLink(int $id): array
    {
        $client = $this->model->getById($id);

        if (!$client) {
            return [
                'success' => false,
                'code'    => 404,
                'message' => "Client introuvable."
            ];
        }

        try {
            $token = $this->tokenModel->create($id, 'password_reset', 60);

            $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
            $resetUrl    = "{$frontendUrl}/reinitialiser-mot-de-passe?token={$token}";

            $this->emailService->sendPasswordResetLink(
                $client['email'],
                $client['first_name'],
                $resetUrl
            );

            return [
                'success' => true,
                'code'    => 200,
                'message' => "Lien de réinitialisation envoyé avec succès."
            ];
        } catch (\Exception $e) {
            error_log("Erreur dans AdminClientService::sendPasswordResetLink : " . $e->getMessage());
            return [
                'success' => false,
                'code'    => 500,
                'message' => "Impossible d'envoyer le lien de réinitialisation."
            ];
        }
    }
}
