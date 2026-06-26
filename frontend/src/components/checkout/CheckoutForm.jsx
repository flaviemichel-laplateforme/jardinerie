import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Bloque la soumission si Stripe n'est pas encore chargé
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Soumission du paiement à l'API Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Critère d'acceptation 2 : Redirection post-paiement réussie
        return_url: `${window.location.origin}/commande/confirmation`,
      },
    });

    // Critère d'acceptation 1 : Gestion des erreurs Stripe
    // Ce bloc n'est atteint que si le paiement échoue immédiatement (ex: carte refusée, fonds insuffisants)
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setErrorMessage(error.message);
    } else {
      setErrorMessage("Une erreur inattendue s'est produite. Veuillez réessayer.");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      
      {/* Le composant intelligent de Stripe (Gère la carte, la date et le CVC) */}
      <PaymentElement id="payment-element" className="mb-6" />
      
      {/* Affichage des messages d'erreur à l'utilisateur */}
      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      <button
        disabled={isProcessing || !stripe || !elements}
        className="w-full rounded-lg bg-[#505F40] px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement en cours...
          </span>
        ) : (
          "Valider le paiement"
        )}
      </button>
    </form>
  );
}