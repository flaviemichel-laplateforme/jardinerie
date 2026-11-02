<?php

namespace App\Controllers;

use App\Core\ApiResponse;
use App\Core\Input;
use App\Core\RateLimiter;
use App\Core\SecurityLog;
use App\Core\ShippingPolicy;
use App\Services\PaymentService;
use App\Models\AddressModel;
use App\Models\CartItemModel;
use App\Models\OrderModel;
use App\Middlewares\AuthMiddleware;
use App\Services\EmailService;
use App\Models\UserModel;

class CheckoutController
{
    private const HOUR = 3600;

    private RateLimiter $limiter;

    public function __construct(
        private PaymentService $paymentService = new PaymentService(),
        private CartItemModel $cartItemModel = new CartItemModel(),
        private OrderModel $orderModel = new OrderModel(),
        private EmailService $emailService = new EmailService(),
        private UserModel $userModel = new UserModel(),
        private AddressModel $addressModel = new AddressModel(),
        ?RateLimiter $limiter = null
    ) {
        $this->limiter = $limiter ?? RateLimiter::fromEnvironment();
    }

    /**
     * POST /api/checkout/payment-intent
     *
     * Le navigateur n'envoie que des identifiants et des quantités : prix, stock et livraison sont recalculés ici d'après la base.
     * Rien n'est ajusté en silence : si le panier ne peut pas être servi tel quel, on le dit (409), pour que le client sache ce qu'il paie.
     */
    public function createIntent(): void
    {
        try {
            $payload = AuthMiddleware::authenticate();
            $userId  = (int) $payload['id'];

            // Chaque appel crée un paiement chez Stripe : sans limite, on pourrait en inonder le compte
            $state = $this->limiter->attempt('checkout_intent_user', (string) $userId, 20, self::HOUR);
            if (!$state['allowed']) {
                ApiResponse::tooManyRequests($state['retryAfter']);
                return;
            }

            $data = Input::json() ?? [];

            $cart = CartItemModel::normalize($data['items'] ?? null);
            if ($cart['error'] !== null) {
                $this->fail(400, $cart['error']);
                return;
            }

            // Les adresses doivent être CELLES DU CLIENT : leur texte est copié dans la commande
            $shippingId = (int) filter_var($data['shipping_address_id'] ?? 0, FILTER_VALIDATE_INT);
            $billingId  = (int) filter_var($data['billing_address_id'] ?? $shippingId, FILTER_VALIDATE_INT);

            if (!$this->addressModel->belongsToUser($shippingId, $userId)) {
                $this->fail(400, 'Adresse de livraison invalide.');
                return;
            }
            if (!$this->addressModel->belongsToUser($billingId, $userId)) {
                $this->fail(400, 'Adresse de facturation invalide.');
                return;
            }

            $inspection = $this->cartItemModel->inspect($cart['lines']);

            if ($inspection['problems'] !== []) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => 'Certains articles ne sont plus disponibles dans la quantité demandée. Votre panier doit être mis à jour.',
                    'errors'  => $inspection['problems'],
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            if ($inspection['total_cents'] <= 0) {
                $this->fail(400, 'Panier invalide.');
                return;
            }

            // Montant débité = articles + livraison. La règle de livraison est écrite une seule fois (ShippingPolicy).
            $shippingCents = ShippingPolicy::costCents($inspection['total_cents']);
            $amountCents   = $inspection['total_cents'] + $shippingCents;

            $intent = $this->paymentService->createPaymentIntent(
                $amountCents,
                $userId,
                $inspection['items'],
                $shippingId,
                $billingId,
                $this->orderModel->lastOrderIdForUser($userId)
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'status'  => 200,
                'data'    => [
                    'paymentIntent' => $intent,
                    'cart'          => [
                        'items'         => $inspection['items'],
                        'total'         => $inspection['total'],
                        'shipping_cost' => $shippingCents / 100,
                        'grand_total'   => $amountCents / 100,
                    ],
                ],
            ], JSON_UNESCAPED_UNICODE);
        } catch (\Throwable $e) {
            // Le détail (message de Stripe, trace) reste dans le journal du serveur : il n'a rien à faire dans la réponse
            error_log('CHECKOUT ERROR (payment-intent) : ' . $e->getMessage());
            $this->fail(500, "Impossible de préparer le paiement pour le moment. Réessayez dans quelques instants.");
        }
    }

    /**
     * GET /api/checkout/confirmation?payment_intent=pi_...
     *
     * La page de confirmation du site NE DOIT PAS croire l'adresse de la page (« ?redirect_status=succeeded » se tape à la main) :
     * elle demande ici, et l'API interroge Stripe. Réponse : paid (commande créée), processing (payé mais le webhook n'a pas encore
     * créé la commande : la page réessaie) ou failed.
     */
    public function confirmation(): void
    {
        $payload = AuthMiddleware::authenticate();
        $userId  = (int) $payload['id'];

        $state = $this->limiter->attempt('checkout_confirmation_user', (string) $userId, 120, self::HOUR);
        if (!$state['allowed']) {
            ApiResponse::tooManyRequests($state['retryAfter']);
            return;
        }

        $paymentIntentId = is_string($_GET['payment_intent'] ?? null) ? $_GET['payment_intent'] : '';

        if (!preg_match('/^pi_[A-Za-z0-9]{10,100}$/', $paymentIntentId)) {
            $this->fail(400, 'Identifiant de paiement invalide.');
            return;
        }

        try {
            $paymentIntent = $this->paymentService->retrievePaymentIntent($paymentIntentId);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            $this->fail(404, 'Paiement introuvable.');
            return;
        } catch (\Throwable $e) {
            error_log('CHECKOUT ERROR (confirmation) : ' . $e->getMessage());
            $this->fail(503, 'Impossible de vérifier le paiement pour le moment. Réessayez dans quelques instants.');
            return;
        }

        // Le paiement d'un autre client : même réponse qu'un paiement inexistant (on ne révèle pas qu'il existe)
        if ((int) ($paymentIntent->metadata->user_id ?? 0) !== $userId) {
            $this->fail(404, 'Paiement introuvable.');
            return;
        }

        $order  = null;
        $status = 'failed';

        if ($paymentIntent->status === 'succeeded') {
            $found  = $this->orderModel->findByPaymentIntentForUser($paymentIntentId, $userId);
            $status = $found ? 'paid' : 'processing';

            if ($found) {
                $order = [
                    'id'              => (int) $found['id'],
                    'order_reference' => $found['order_reference'],
                    'total'           => (float) $found['total_amount_tax_incl'],
                    'shipping_cost'   => (float) $found['shipping_cost_tax_incl'],
                    'grand_total'     => round((float) $found['total_amount_tax_incl'] + (float) $found['shipping_cost_tax_incl'], 2),
                ];
            }
        } elseif ($paymentIntent->status === 'processing') {
            $status = 'processing';
        }

        http_response_code(200);
        echo json_encode(['success' => true, 'data' => ['status' => $status, 'order' => $order]], JSON_UNESCAPED_UNICODE);
    }

    /**
     * POST /api/webhooks/stripe
     */
    public function handleWebhook(): void
    {
        $payload   = @file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        try {
            $event = $this->paymentService->verifyWebhookSignature($payload, $sigHeader);

            if ($event->type === 'payment_intent.succeeded') {
                $paymentIntent   = $event->data->object;
                $paymentIntentId = $paymentIntent->id;
                $userId          = isset($paymentIntent->metadata->user_id)
                    ? (int) $paymentIntent->metadata->user_id
                    : null;
                $itemsJson       = $paymentIntent->metadata->items ?? '[]';
                $shippingId      = (int) ($paymentIntent->metadata->shipping_address_id ?? 0);
                $billingId       = (int) ($paymentIntent->metadata->billing_address_id ?? 0);

                if (!$userId) {
                    http_response_code(200);
                    echo json_encode(['status' => 'skipped_no_metadata']);
                    return;
                }

                if ($this->orderModel->existsByPaymentIntent($paymentIntentId)) {
                    http_response_code(200);
                    echo json_encode(['status' => 'already_processed']);
                    return;
                }

                $rawItems = json_decode($itemsJson, true) ?? [];
                $items = array_map(fn($i) => [
                    'product_id' => $i['pid'],
                    'quantity'   => $i['qty'],
                ], $rawItems);

                $paidCents = (int) ($paymentIntent->amount_received ?? $paymentIntent->amount);

                // Le client a DÉJÀ payé : on crée la commande avec ce qui est disponible (calcul tolérant) plutôt que de la perdre
                $cart = empty($items)
                    ? ['items' => [], 'total' => $paidCents / 100, 'total_cents' => $paidCents]
                    : $this->cartItemModel->calculateCart($items);

                // Prix ou stock modifiés entre le paiement et le webhook : la commande est créée, mais l'écart est signalé pour vérification
                $expectedCents = $cart['total_cents'] + ShippingPolicy::costCents($cart['total_cents']);
                if ($expectedCents !== $paidCents) {
                    error_log("PAYMENT MISMATCH {$paymentIntentId} : payé {$paidCents} centimes, attendu {$expectedCents}");
                    SecurityLog::record(SecurityLog::PAYMENT_MISMATCH, $userId, null, [
                        'order_ref' => OrderModel::referenceFor($paymentIntentId),
                        'paid'      => $paidCents,
                        'expected'  => $expectedCents,
                    ]);
                }

                try {
                    $this->orderModel->createFromPayment($userId, $cart, $paymentIntentId, $shippingId, $billingId);
                } catch (\PDOException $e) {
                    // 1062 = référence déjà prise : une autre livraison du même webhook vient de créer la commande (course) : rien à faire
                    if (($e->errorInfo[1] ?? 0) === 1062) {
                        http_response_code(200);
                        echo json_encode(['status' => 'already_processed']);
                        return;
                    }
                    throw $e;
                }

                //Email de confirmation (non bloquant — la commande est déjà créée)
                $user = $this->userModel->findById($userId);
                if ($user) {
                    $this->emailService->sendOrderConfirmation(
                        $user['email'],
                        $user['first_name'],
                        OrderModel::referenceFor($paymentIntentId),
                        $cart['items'],
                        $cart['total'],
                        ShippingPolicy::cost($cart['total'])
                    );
                }
            }


            http_response_code(200);
            echo json_encode(['status' => 'success']);
        } catch (\Exception $e) {
            error_log("WEBHOOK ERROR: " . $e->getMessage() . " | " . $e->getTraceAsString());
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    private function fail(int $code, string $message): void
    {
        http_response_code($code);
        echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    }
}
