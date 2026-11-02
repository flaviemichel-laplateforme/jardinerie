import { formatEuro } from '../../constants/shipping';

/**
 * Récapitulatif de la commande. Les montants sont ceux que l'API vient de calculer ET de demander à Stripe (articles + livraison) :
 * on les affiche tels quels, on ne recalcule rien dans le navigateur.
 */
export default function OrderRecap({ cart }) {
  return (
    <section aria-labelledby="recap-title" className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
      <h2 id="recap-title" className="mb-4 text-xl font-bold text-jardinerie-text">Récapitulatif</h2>

      <ul className="mb-4 space-y-2 text-sm text-gray-700">
        {cart.items.map((item) => (
          <li key={item.product_id} className="flex justify-between gap-4">
            <span>{item.name} × {item.quantity}</span>
            <span className="whitespace-nowrap">{formatEuro(item.line_total)}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-gray-200 pt-4 text-sm text-gray-700">
        <div className="flex justify-between">
          <dt>Sous-total</dt>
          <dd>{formatEuro(cart.total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Livraison</dt>
          <dd>{cart.shipping_cost === 0 ? 'Gratuite' : formatEuro(cart.shipping_cost)}</dd>
        </div>
        <div className="flex items-end justify-between border-t border-gray-200 pt-3">
          <dt className="font-bold uppercase tracking-wide text-jardinerie-text">Total à payer</dt>
          <dd className="text-2xl font-black text-jardinerie-primary">{formatEuro(cart.grand_total)}</dd>
        </div>
      </dl>
    </section>
  );
}
