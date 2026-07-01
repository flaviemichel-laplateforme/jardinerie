import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export default function CheckoutConfirmation() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const status = searchParams.get('redirect_status');
  const paymentIntentId = searchParams.get('payment_intent');

  // On vide le panier une seule fois, au chargement de cette page,
  // uniquement si le paiement a réellement réussi.
  useEffect(() => {
    if (status === 'succeeded') {
      clearCart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status !== 'succeeded') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-xl bg-red-50 border border-red-100 p-10">
          <h1 className="text-2xl font-bold text-red-600 mb-3">
            Paiement non abouti
          </h1>
          <p className="text-gray-600 mb-6">
            Votre paiement n'a pas pu être traité. Aucun montant n'a été débité.
          </p>
          <Link
            to="/panier"
            className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white"
          >
            Retourner au panier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="rounded-xl bg-jardinerie-bg border border-jardinerie-primary/20 p-10">

        {/* Icône de succès */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-jardinerie-primary">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-jardinerie-text mb-3">
          Commande confirmée !
        </h1>

        <p className="text-gray-600 mb-2">
          Merci pour votre achat. Votre paiement a bien été reçu.
        </p>

        {/* Référence Stripe, utile pour le support client */}
        <p className="text-xs text-gray-400 font-mono mb-8">
          Référence : {paymentIntentId}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white"
          >
            Retourner à l'accueil
          </Link>
          <Link
            to="/compte/commandes"
            className="rounded-full border border-jardinerie-primary px-8 py-3 text-sm font-bold text-jardinerie-primary"
          >
            Voir mes commandes
          </Link>
        </div>

      </div>
    </div>
  );
}