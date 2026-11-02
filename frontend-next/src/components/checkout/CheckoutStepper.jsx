const STEPS = ['Panier', 'Livraison', 'Paiement', 'Confirmation'];

/**
 * Étapes de la commande (1 à 4). Une liste ordonnée pour les lecteurs d'écran, avec l'étape en cours annoncée (aria-current="step") :
 * l'ancien site ne portait cette information que par la couleur.
 */
export default function CheckoutStepper({ currentStep }) {
  return (
    <nav aria-label="Étapes de la commande" className="mx-auto mb-8 w-full max-w-2xl">
      <ol className="flex items-start justify-between">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const isDone = number < currentStep;
          const isCurrent = number === currentStep;

          return (
            <li key={label} aria-current={isCurrent ? 'step' : undefined} className="relative flex flex-1 flex-col items-center text-center">
              {/* Trait vers l'étape suivante */}
              {number < STEPS.length && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-4 h-0.5 w-full ${isDone ? 'bg-jardinerie-primary' : 'bg-gray-200'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isDone || isCurrent ? 'bg-jardinerie-primary text-white' : 'border border-gray-300 bg-white text-gray-500'
                }`}
              >
                {isDone ? <span aria-hidden="true">✓</span> : number}
                {isDone && <span className="sr-only">{number}</span>}
              </span>
              <span className={`mt-2 text-xs ${isCurrent ? 'font-bold text-jardinerie-text' : 'text-gray-600'}`}>
                {label}
                {isDone && <span className="sr-only"> (terminée)</span>}
                {isCurrent && <span className="sr-only"> (étape en cours)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
