'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js/pure';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../../contexts/CartContext';
import { useCheckoutState } from '../../hooks/useCheckoutState';
import { sendJson } from '../../services/requestJson';
import { checkoutService, STRIPE_PUBLIC_KEY } from '../../services/checkoutService';
import { formatWait } from '../../utils/validation';
import { LoadingState } from '../account/DataState';
import CheckoutStepper from './CheckoutStepper';
import OrderRecap from './OrderRecap';
import PaymentForm from './PaymentForm';

// « pure » : le script de Stripe ne se charge qu'à l'appel de loadStripe, donc seulement sur cette page (et une seule fois)
let stripePromise = null;
const getStripe = () => (stripePromise ??= loadStripe(STRIPE_PUBLIC_KEY));

const ELEMENTS_APPEARANCE = { theme: 'stripe', variables: { colorPrimary: '#027148' } };

/**
 * Étape 3 : paiement. À l'ouverture, l'API crée l'intention de paiement : elle relit prix, stock et livraison dans la base,
 * vérifie que les adresses sont bien celles du client, et fixe le montant que Stripe débitera.
 */
export default function PaymentStep() {
  const router = useRouter();
  const { cartItems, isCartLoaded } = useCart();
  const { state, isLoaded } = useCheckoutState();

  // phase : 'loading' | 'ready' | 'error'. clientSecret : jamais stocké, seulement gardé en mémoire le temps de cette page.
  const [intent, setIntent] = useState({ phase: 'loading', clientSecret: null, cart: null, failure: null });

  // Les options d'Elements ne doivent pas changer à chaque affichage : on les construit une fois par intention de paiement
  const elementsOptions = useMemo(
    () => ({ clientSecret: intent.clientSecret, locale: 'fr', appearance: ELEMENTS_APPEARANCE }),
    [intent.clientSecret]
  );

  const shippingId = state.shippingAddressId;
  const billingId = state.billingAddressId ?? state.shippingAddressId;
  const ready = isCartLoaded && isLoaded;
  const nothingToPay = ready && cartItems.length === 0;
  const noAddress = ready && !nothingToPay && !shippingId;

  // Garde-fous : rien à payer -> panier ; pas d'adresse choisie -> livraison
  useEffect(() => {
    if (nothingToPay) router.replace('/panier');
    else if (noAddress) router.replace('/commande/livraison');
  }, [nothingToPay, noAddress, router]);

  useEffect(() => {
    if (!ready || nothingToPay || noAddress || !STRIPE_PUBLIC_KEY) return;

    const controller = new AbortController();
    const items = cartItems.map((item) => ({ product_id: item.id, quantity: item.quantity }));

    sendJson(checkoutService.buildPaymentIntentUrl(), {
      body: { items, shipping_address_id: shippingId, billing_address_id: billingId },
      signal: controller.signal,
    }).then((result) => {
      if (controller.signal.aborted) return;

      if (result.ok) {
        setIntent({ phase: 'ready', clientSecret: result.data.paymentIntent.clientSecret, cart: result.data.cart, failure: null });
        return;
      }

      // Session expirée pendant la commande : on revient ici après la connexion
      if (result.status === 401) {
        router.replace(`/connexion?redirect=${encodeURIComponent('/commande/paiement')}`);
        return;
      }

      // Adresse refusée par l'API (supprimée, ou pas la sienne) : on la fait rechoisir
      if (result.status === 400 && /adresse/i.test(result.message)) {
        router.replace('/commande/livraison');
        return;
      }

      setIntent({ phase: 'error', clientSecret: null, cart: null, failure: result });
    });

    return () => controller.abort();
    // L'intention se crée une fois à l'ouverture de la page : le panier est figé pendant le paiement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, nothingToPay, noAddress]);

  if (!STRIPE_PUBLIC_KEY) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <CheckoutStepper currentStep={3} />
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Le paiement est momentanément indisponible. Merci de réessayer plus tard.
        </div>
      </div>
    );
  }

  if (!ready || nothingToPay || noAddress || intent.phase === 'loading') {
    return <LoadingState message="Préparation du paiement..." />;
  }

  if (intent.phase === 'error') {
    const { status, message, errors, retryAfter } = intent.failure;
    const names = new Map(cartItems.map((item) => [item.id, item.name]));

    return (
      <div className="mx-auto max-w-2xl py-8">
        <CheckoutStepper currentStep={3} />
        <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-bold">{status === 429 ? `${message} (${formatWait(retryAfter)})` : message}</p>

          {/* 409 : le panier ne peut pas être servi tel quel (rupture, stock insuffisant, article retiré) */}
          {errors.length > 0 && (
            <ul className="list-inside list-disc">
              {errors.map((problem) => (
                <li key={problem.product_id}>
                  {names.get(problem.product_id) ?? `Article ${problem.product_id}`} :{' '}
                  {problem.reason === 'insufficient_stock'
                    ? `seulement ${problem.available} disponible(s) (vous en demandez ${problem.requested})`
                    : 'plus disponible'}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/panier" className="rounded-full bg-jardinerie-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
              {status === 409 ? 'Mettre à jour mon panier' : 'Retour au panier'}
            </Link>
            {status !== 409 && status !== 429 && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full border border-red-300 px-6 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      <CheckoutStepper currentStep={3} />

      <h1 className="mb-6 text-2xl font-bold text-jardinerie-text">Paiement</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Elements stripe={getStripe()} options={elementsOptions}>
            <PaymentForm grandTotal={intent.cart.grand_total} />
          </Elements>

          <p className="mt-6 text-center text-sm">
            <Link href="/commande/livraison" className="font-medium text-jardinerie-primary underline">
              ← Modifier mon adresse
            </Link>
          </p>
        </div>

        <div className="self-start lg:col-span-2">
          <OrderRecap cart={intent.cart} />
        </div>
      </div>
    </div>
  );
}
