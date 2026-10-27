import { Check, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, formatEuro } from '../../constants/shipping';

/**
 * Indique au client où il en est vis-à-vis de la livraison offerte :
 * combien il lui manque, avec une barre de progression, puis une confirmation une fois le seuil atteint.
 *
 * @param {number} cartTotal - Total TTC du panier
 */
export default function FreeShippingProgress({ cartTotal }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const isFree = remaining === 0;
  const percent = Math.min(100, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="rounded-[14px] border border-jardinerie-primary/20 bg-white p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-jardinerie-text">
        {isFree ? (
          <Check size={18} className="shrink-0 text-jardinerie-primary" aria-hidden="true" />
        ) : (
          <Truck size={18} className="shrink-0 text-jardinerie-primary" aria-hidden="true" />
        )}
        {isFree
          ? 'Livraison offerte'
          : `Plus que ${formatEuro(remaining)} pour profiter de la livraison offerte`}
      </p>

      {/* La barre est un complément visuel : le message ci-dessus porte déjà l'information en texte. */}
      <div
        role="progressbar"
        aria-label="Progression vers la livraison offerte"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-jardinerie-primary/15"
      >
        <div
          className="h-full rounded-full bg-jardinerie-primary transition-all duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
