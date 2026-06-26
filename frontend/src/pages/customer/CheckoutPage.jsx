import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import { useApi } from '../../hooks/useApi';

console.log("Vérification clé :", import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await request('http://localhost:8000/api/checkout/payment-intent', { method: 'POST' });
        console.log("Réponse API complète :", response);
        if (response?.data?.clientSecret) {
          setClientSecret(response.data.clientSecret);
        }
      } catch (err) {
        console.error("Erreur lors de l'initialisation du paiement:", err);
      }
    };

    fetchPaymentIntent();
  }, [request]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#505F40', 
    },
  };

  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Finaliser la commande</h1>
      
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          Impossible de joindre le serveur de paiement.
        </div>
      )}

      {clientSecret ? (
        <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      ) : (
        <div className="flex items-center justify-center py-12">
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-jardinerie-primary border-t-transparent"></div>
          ) : null}
        </div>
      )}
    </div>
  );
}