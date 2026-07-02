// src/pages/public/CheckoutPayment.jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCheckout } from '../../contexts/CheckoutContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { setClientSecret } = useCheckout();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commande/confirmation`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
    // Si succès → Stripe redirige, on n'arrive jamais ici
    // Le clientSecret sera vidé dans CheckoutConfirmation
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-full bg-jardinerie-primary py-3.5 text-sm font-bold text-white disabled:opacity-40"
      >
        {loading ? 'Paiement en cours...' : 'Payer maintenant'}
      </button>
    </form>
  );
}

export default function CheckoutPayment() {
  const { clientSecret, setClientSecret } = useCheckout();
  const navigate = useNavigate();

  // Si on arrive ici sans clientSecret (accès direct à l'URL ou après
  // une confirmation déjà traitée), on renvoie au début du tunnel.
  if (!clientSecret) {
    navigate('/commande/livraison');
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#027148' },
    },
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h2 className="mb-6 text-lg font-bold text-jardinerie-text">Paiement sécurisé</h2>

      <Elements stripe={stripePromise} options={options}>
        <PaymentForm />
      </Elements>

      <p className="mt-4 text-center text-xs text-gray-400">
        Paiement sécurisé par Stripe — vos données bancaires ne transitent jamais par nos serveurs.
      </p>
    </div>
  );
}