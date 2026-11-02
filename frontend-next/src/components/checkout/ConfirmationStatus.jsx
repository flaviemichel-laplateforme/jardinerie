'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CircleCheck, CircleX } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCheckoutState } from '../../hooks/useCheckoutState';
import { sendJson } from '../../services/requestJson';
import { checkoutService } from '../../services/checkoutService';
import { formatEuro } from '../../constants/shipping';
import Spinner from '../ui/Spinner';
import CheckoutStepper from './CheckoutStepper';

// La commande est créée par le webhook de Stripe, qui arrive APRÈS la redirection du client : on réinterroge l'API pendant ~30 s
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

function Card({ children }) {
  return <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-lg">{children}</div>;
}

const PrimaryLink = ({ href, children }) => (
  <Link href={href} className="inline-block rounded-full bg-jardinerie-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
    {children}
  </Link>
);

const SecondaryLink = ({ href, children }) => (
  <Link href={href} className="inline-block rounded-full border border-jardinerie-primary px-6 py-2.5 text-sm font-bold text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white">
    {children}
  </Link>
);

/**
 * Étape 4 : confirmation. On ne croit PAS l'adresse de la page (« ?redirect_status=succeeded » se tape à la main) : on demande à
 * l'API, qui interroge Stripe. Le panier n'est vidé que lorsque le paiement est confirmé par l'API.
 */
export default function ConfirmationStatus() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { clear: clearCheckout } = useCheckoutState();

  // L'identifiant du paiement vient de l'adresse. On le garde en mémoire puis on EFFACE l'adresse (elle contient aussi le secret du
  // paiement, qui n'a rien à faire dans l'historique du navigateur).
  const [paymentIntentId] = useState(() => searchParams.get('payment_intent') ?? '');
  // kind : 'checking' | 'processing' | 'paid' | 'delayed' | 'failed' | 'unknown' | 'session' | 'error'
  const [outcome, setOutcome] = useState({ kind: 'checking', order: null, message: '' });
  const cleared = useRef(false);

  useEffect(() => {
    if (!paymentIntentId) return;
    window.history.replaceState(null, '', window.location.pathname);

    let cancelled = false;
    let timer;
    let attempts = 0;

    const check = async () => {
      const result = await sendJson(checkoutService.buildConfirmationUrl(paymentIntentId), { method: 'GET' });
      if (cancelled) return;

      if (result.status === 401) return setOutcome({ kind: 'session', order: null, message: '' });
      if (result.status === 404) return setOutcome({ kind: 'unknown', order: null, message: '' });
      if (!result.ok) return setOutcome({ kind: 'error', order: null, message: result.message });

      const { status, order } = result.data;

      if (status === 'processing') {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) return setOutcome({ kind: 'delayed', order: null, message: '' });
        setOutcome({ kind: 'processing', order: null, message: '' });
        timer = setTimeout(check, POLL_INTERVAL_MS);
        return;
      }

      setOutcome({ kind: status, order, message: '' });
    };

    check();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentIntentId]);

  // Le paiement est confirmé (ou en cours de finalisation chez Stripe) : le panier ne doit plus pouvoir être payé une seconde fois
  useEffect(() => {
    if ((outcome.kind === 'paid' || outcome.kind === 'delayed') && !cleared.current) {
      cleared.current = true;
      clearCart();
      clearCheckout();
    }
  }, [outcome.kind, clearCart, clearCheckout]);

  let content;

  if (!paymentIntentId) {
    content = (
      <Card>
        <h1 className="mb-3 text-2xl font-bold text-jardinerie-text">Aucun paiement à confirmer</h1>
        <p className="mb-6 text-sm text-gray-600">Cette page s&apos;ouvre après un paiement. Retrouvez vos achats dans votre espace client.</p>
        <PrimaryLink href="/panier">Retour au panier</PrimaryLink>
      </Card>
    );
  } else if (outcome.kind === 'checking' || outcome.kind === 'processing') {
    content = (
      <Card>
        <Spinner message="" className="min-h-[120px]" />
        <h1 className="mb-2 text-xl font-bold text-jardinerie-text">Nous finalisons votre commande...</h1>
        <p role="status" className="text-sm text-gray-600">
          Votre paiement est en cours de confirmation. Merci de ne pas fermer cette page ni de payer une seconde fois.
        </p>
      </Card>
    );
  } else if (outcome.kind === 'paid') {
    const { order } = outcome;
    content = (
      <Card>
        <CircleCheck size={56} className="mx-auto mb-4 text-jardinerie-primary" aria-hidden="true" />
        <h1 className="mb-2 text-2xl font-bold text-jardinerie-text">Commande confirmée !</h1>
        <p role="status" className="mb-1 text-sm text-gray-700">Merci pour votre achat.</p>
        <p className="mb-1 text-sm text-gray-700">Référence : <strong>{order.order_reference}</strong></p>
        <p className="mb-6 text-sm text-gray-700">Total payé : <strong>{formatEuro(order.grand_total)}</strong></p>
        <p className="mb-6 text-xs text-gray-600">Un e-mail de confirmation vous est envoyé.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryLink href={`/compte/commandes/${order.id}`}>Voir ma commande</PrimaryLink>
          <SecondaryLink href="/vegetaux">Continuer mes achats</SecondaryLink>
        </div>
      </Card>
    );
  } else if (outcome.kind === 'delayed') {
    content = (
      <Card>
        <CircleCheck size={56} className="mx-auto mb-4 text-jardinerie-primary" aria-hidden="true" />
        <h1 className="mb-2 text-2xl font-bold text-jardinerie-text">Paiement reçu</h1>
        <p role="status" className="mb-6 text-sm text-gray-700">
          Votre paiement a bien été reçu. Votre commande apparaîtra dans « Mes commandes » dans quelques instants.
          Merci de ne pas payer une seconde fois.
        </p>
        <PrimaryLink href="/compte/commandes">Voir mes commandes</PrimaryLink>
      </Card>
    );
  } else if (outcome.kind === 'failed') {
    content = (
      <Card>
        <CircleX size={56} className="mx-auto mb-4 text-red-500" aria-hidden="true" />
        <h1 className="mb-2 text-2xl font-bold text-jardinerie-text">Paiement non abouti</h1>
        <p role="alert" className="mb-6 text-sm text-gray-700">Aucun montant n&apos;a été débité. Votre panier est conservé.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryLink href="/commande/paiement">Réessayer le paiement</PrimaryLink>
          <SecondaryLink href="/panier">Retour au panier</SecondaryLink>
        </div>
      </Card>
    );
  } else if (outcome.kind === 'session') {
    content = (
      <Card>
        <h1 className="mb-3 text-2xl font-bold text-jardinerie-text">Session expirée</h1>
        <p role="alert" className="mb-6 text-sm text-gray-700">
          Reconnectez-vous pour consulter votre commande. Si votre paiement a abouti, elle apparaîtra dans « Mes commandes ».
        </p>
        <PrimaryLink href={`/connexion?redirect=${encodeURIComponent('/compte/commandes')}`}>Se connecter</PrimaryLink>
      </Card>
    );
  } else {
    content = (
      <Card>
        <h1 className="mb-3 text-2xl font-bold text-jardinerie-text">
          {outcome.kind === 'unknown' ? 'Paiement introuvable' : 'Vérification impossible'}
        </h1>
        <p role="alert" className="mb-6 text-sm text-gray-700">
          {outcome.kind === 'unknown'
            ? 'Nous ne trouvons pas ce paiement.'
            : outcome.message || 'Nous n\'avons pas pu vérifier votre paiement pour le moment.'}
          {' '}Si vous avez été débité, votre commande apparaîtra dans « Mes commandes ».
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryLink href="/compte/commandes">Mes commandes</PrimaryLink>
          <SecondaryLink href="/panier">Retour au panier</SecondaryLink>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-8">
      <CheckoutStepper currentStep={4} />
      {content}
    </div>
  );
}
