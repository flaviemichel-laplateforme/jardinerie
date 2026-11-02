<?php

namespace App\Controllers;

use App\Core\ApiResponse;
use App\Core\ClientIp;
use App\Core\Input;
use App\Core\RateLimiter;
use App\Core\ShippingPolicy;
use App\Models\CartItemModel;

class CartController
{
    private RateLimiter $limiter;

    public function __construct(private CartItemModel $cartItemModel = new CartItemModel(), ?RateLimiter $limiter = null)
    {
        $this->limiter = $limiter ?? RateLimiter::fromEnvironment();
    }

    /**
     * POST /api/cart/summary (public : le panier se remplit avant de se connecter)
     *
     * Le navigateur envoie [{product_id, quantity}] et reçoit ce que la base dit AUJOURD'HUI : prix, stock, quantités ajustées,
     * articles retirés, livraison, total. Le panier enregistré dans le navigateur peut dater de plusieurs jours : c'est cette
     * réponse, et non l'ancien instantané, qui doit s'afficher (et c'est celle que le paiement appliquera).
     */
    public function summary(): void
    {
        $state = $this->limiter->attempt('cart_summary_ip', ClientIp::current(), 120, 3600);
        if (!$state['allowed']) {
            ApiResponse::tooManyRequests($state['retryAfter']);
            return;
        }

        $data = Input::json() ?? [];
        $raw  = $data['items'] ?? [];

        // Panier vide : réponse valide, rien à calculer
        if ($raw === []) {
            $this->respond([], [], 0);
            return;
        }

        $cart = CartItemModel::normalize($raw);
        if ($cart['error'] !== null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $cart['error']], JSON_UNESCAPED_UNICODE);
            return;
        }

        $inspection = $this->cartItemModel->inspect($cart['lines']);
        $this->respond($inspection['items'], $inspection['problems'], $inspection['total_cents']);
    }

    private function respond(array $items, array $problems, int $itemsCents): void
    {
        $shippingCents = ShippingPolicy::costCents($itemsCents);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data'    => [
                'items'                   => $items,
                'problems'                => $problems,
                'subtotal'                => $itemsCents / 100,
                'shipping_cost'           => $shippingCents / 100,
                'total'                   => ($itemsCents + $shippingCents) / 100,
                'free_shipping_threshold' => ShippingPolicy::FREE_THRESHOLD_CENTS / 100,
                'shipping_base_cost'      => ShippingPolicy::COST_CENTS / 100,
            ],
        ], JSON_UNESCAPED_UNICODE);
    }
}
