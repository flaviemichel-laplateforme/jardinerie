// src/pages/public/CheckoutPayment.jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCheckout } from '../../contexts/CheckoutContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// Initialisation de Stripe — en dehors du composant pour n'être exécutée qu'une seule fois.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Composant interne : accède aux hooks Stripe (uniquement disponibles à l'intérieur de <Elements>)
function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return; // Stripe n'est pas encore prêt

    setLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL vers laquelle Stripe redirige après paiement réussi
        return_url: `${window.location.origin}/commande/confirmation`,
      },
    });

    // Si on arrive ici, c'est qu'il y a eu une erreur (sinon Stripe aurait redirigé)
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* La fenêtre sécurisée Stripe — jamais un vrai <input> de votre côté */}
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

// Composant principal : initialise Stripe avec le clientSecret
export default function CheckoutPayment() {
  const { clientSecret } = useCheckout();
  const navigate = useNavigate();

  // Si on arrive ici sans clientSecret (accès direct à l'URL), on renvoie au début
  if (!clientSecret) {
    navigate('/commande/livraison');
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#027148' }, // votre couleur jardinerie-primary
    },
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h2 className="mb-6 text-lg font-bold text-jardinerie-text">Paiement sécurisé</h2>

      {/* Elements fournit le contexte Stripe à PaymentForm */}
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm />
      </Elements>

      <p className="mt-4 text-center text-xs text-gray-400">
        Paiement sécurisé par Stripe — vos données bancaires ne transitent jamais par nos serveurs.
      </p>
    </div>
  );
}