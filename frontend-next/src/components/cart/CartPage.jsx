'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCartSummary } from '../../hooks/useCartSummary';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../constants/shipping';
import Spinner from '../ui/Spinner';
import CheckoutStepper from '../checkout/CheckoutStepper';
import FreeShippingProgress from './FreeShippingProgress';
import CartLine from './CartLine';
import CartSummary from './CartSummary';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, isCartLoaded, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { summary, status, notices, unavailableIds, dismissNotices } = useCartSummary();

  // Le panier démarre vide le temps de lire le navigateur : sans cette attente, « panier vide » clignoterait à chaque ouverture
  if (!isCartLoaded) return <Spinner message="Chargement de votre panier..." />;

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-jardinerie-text">Votre panier est vide</h1>
        <Link href="/vegetaux" className="inline-block rounded-full bg-jardinerie-primary px-8 py-3.5 text-sm font-bold text-white hover:bg-green-700">
          Découvrir nos végétaux
        </Link>
      </div>
    );
  }

  // Montants : ceux de l'API (la base fait foi, c'est eux que le paiement appliquera). Sans réponse : estimation locale.
  const estimate = !summary;
  const localSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = summary ? summary.subtotal : localSubtotal;
  const shippingCost = summary ? summary.shipping_cost : localSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = summary ? summary.total : localSubtotal + shippingCost;
  const threshold = summary ? summary.free_shipping_threshold : FREE_SHIPPING_THRESHOLD;

  const vatLines = cartItems.filter((item) => !unavailableIds.includes(item.id));
  const unavailableItems = cartItems.filter((item) => unavailableIds.includes(item.id));

  const calculating = status === 'loading' || status === 'refreshing';
  const canCheckout = !calculating && !authLoading && unavailableIds.length === 0;
  const checkoutHint = calculating
    ? 'Mise à jour du panier...'
    : unavailableIds.length > 0
      ? 'Retirez les articles indisponibles pour continuer.'
      : '';

  const handleCheckout = () => {
    // Connexion obligatoire pour commander : on revient ici ensuite
    router.push(isAuthenticated ? '/commande/livraison' : `/connexion?redirect=${encodeURIComponent('/commande/livraison')}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-0 py-4 sm:px-2 sm:py-8">
      <CheckoutStepper currentStep={1} />

      <h1 className="sr-only">Votre panier</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          {unavailableItems.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-bold">Certains articles ne sont plus disponibles :</p>
              <ul className="mt-1 list-inside list-disc">
                {unavailableItems.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
            </div>
          )}

          {notices.length > 0 && (
            <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold">Votre panier a été mis à jour :</p>
              <ul className="mt-1 list-inside list-disc">
                {notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
              <button type="button" onClick={dismissNotices} className="mt-2 text-xs font-bold underline">Compris</button>
            </div>
          )}

          {/* En haut de la liste : sur mobile le résumé est tout en bas, le message doit rester visible */}
          <FreeShippingProgress subtotal={subtotal} threshold={threshold} />

          <ul className="flex flex-col gap-4">
            {cartItems.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                unavailable={unavailableIds.includes(item.id)}
                onQuantityChange={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </ul>
        </div>

        <div className="self-start lg:sticky lg:top-24 lg:col-span-4">
          <CartSummary
            lines={vatLines}
            shippingCost={shippingCost}
            total={total}
            estimate={estimate}
            canCheckout={canCheckout}
            checkoutHint={checkoutHint}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
