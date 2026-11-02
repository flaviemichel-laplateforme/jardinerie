'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatEuro } from '../../constants/shipping';
import FormMessage from '../forms/FormMessage';

/**
 * Formulaire de carte de Stripe (PaymentElement : les numéros de carte sont saisis dans un cadre hébergé par Stripe, ils ne passent
 * JAMAIS par notre site ni par notre API) et bouton « Payer ».
 */
export default function PaymentForm({ grandTotal }) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return; // pas de double paiement sur un double clic

    setSubmitting(true);
    setError('');

    // Stripe redirige ensuite vers la page de confirmation (3D Secure compris). Si la redirection a lieu, la ligne suivante
    // n'est pas atteinte : on ne revient ici que pour une erreur (carte refusée, saisie incomplète...).
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/commande/confirmation` },
    });

    if (stripeError) {
      setError(stripeError.message || 'Le paiement n\'a pas pu être effectué. Merci de réessayer.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormMessage>{error}</FormMessage>

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-full bg-jardinerie-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Paiement en cours...' : `Payer ${formatEuro(grandTotal)}`}
      </button>

      <p className="text-center text-xs text-gray-600">
        Paiement sécurisé par Stripe : vos coordonnées bancaires ne sont jamais communiquées à La Jardinerie.
      </p>
    </form>
  );
}
