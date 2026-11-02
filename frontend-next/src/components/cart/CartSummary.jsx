import { CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import { formatEuro } from '../../constants/shipping';

/** TVA par taux distinct (ex. 5,5 % et 20 %) : un panier peut mêler des produits taxés différemment. Les prix sont TTC. */
function vatBreakdown(lines) {
  const byRate = {};

  for (const { price, tax_rate: rate, quantity } of lines) {
    const ttc = price * quantity;
    const ht = ttc / (1 + rate / 100);
    byRate[rate] ??= { ht: 0, tva: 0 };
    byRate[rate].ht += ht;
    byRate[rate].tva += ttc - ht;
  }

  return byRate;
}

/**
 * Résumé du panier : sous-total HT, livraison, TVA, total TTC et bouton de validation.
 * `estimate` : l'API n'a pas répondu, les montants sont une estimation faite dans le navigateur (le paiement les recalculera).
 */
export default function CartSummary({ lines, shippingCost, total, estimate, canCheckout, checkoutHint, onCheckout }) {
  const breakdown = vatBreakdown(lines);
  const totalHT = Object.values(breakdown).reduce((sum, { ht }) => sum + ht, 0);

  return (
    <section aria-labelledby="cart-summary-title" className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
      <h2 id="cart-summary-title" className="mb-6 text-xl font-bold text-jardinerie-text">Résumé</h2>

      <dl className="mb-6 space-y-3 text-sm text-jardinerie-text/70">
        <div className="flex justify-between">
          <dt>Sous-total HT</dt>
          <dd>{formatEuro(totalHT)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Livraison</dt>
          <dd className="font-bold text-jardinerie-text">{shippingCost === 0 ? 'Gratuite' : formatEuro(shippingCost)}</dd>
        </div>
        {Object.entries(breakdown).map(([rate, { tva }]) => (
          <div key={rate} className="flex justify-between">
            <dt>TVA {String(Number(rate)).replace('.', ',')} %</dt>
            <dd>{formatEuro(tva)}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex items-end justify-between border-t border-gray-200 pt-4">
        <span className="font-bold uppercase tracking-wide text-jardinerie-text">Total</span>
        <span className="text-2xl font-black text-jardinerie-primary">{formatEuro(total)}</span>
      </div>

      {estimate && (
        <p className="mb-4 text-xs text-gray-600">
          Estimation : le montant exact sera recalculé au moment du paiement.
        </p>
      )}

      <button
        type="button"
        onClick={onCheckout}
        disabled={!canCheckout}
        className="mb-2 block w-full rounded-md border border-jardinerie-text py-3 text-center text-sm font-bold uppercase tracking-wider text-jardinerie-text transition-all hover:border-jardinerie-primary hover:bg-jardinerie-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-jardinerie-text disabled:hover:bg-transparent disabled:hover:text-jardinerie-text"
      >
        Valider
      </button>
      <p className="mb-6 min-h-[1rem] text-center text-xs text-gray-600" aria-live="polite">{checkoutHint}</p>

      <div className="flex flex-col items-center">
        <span className="mb-3 text-[10px] font-bold uppercase tracking-widest text-jardinerie-text/60">Paiement sécurisé</span>
        <div className="flex justify-center gap-5 text-jardinerie-text/80" aria-hidden="true">
          <CreditCard className="h-6 w-6" />
          <ShieldCheck className="h-6 w-6" />
          <Smartphone className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}
