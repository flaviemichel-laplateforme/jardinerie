const STEPS = ['Panier', 'Livraison', 'Paiement', 'Confirmation'];

/**
 * Stepper de progression du tunnel d'achat, partagé entre les 4 pages
 * (Panier, Livraison, Paiement, Confirmation) pour garder un repère visuel cohérent.
 */
export default function CheckoutStepper({ currentStep }) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-jardinerie-primary -z-10 transition-all"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isReached = stepNumber <= currentStep;

          return (
            <div key={label} className="flex flex-col items-center bg-white px-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm ${
                  isReached ? 'bg-jardinerie-primary text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {stepNumber}
              </div>
              <span
                className={`text-xs mt-2 ${
                  isReached ? 'font-bold text-jardinerie-primary' : 'font-medium text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
