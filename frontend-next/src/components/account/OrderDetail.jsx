'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccountData } from '../../hooks/useAccountData';
import { accountService } from '../../services/accountService';
import { resolveAssetUrl } from '../../services/apiClient';
import { formatDate, formatEuro } from '../../utils/format';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';
import { LoadingState, ErrorState } from './DataState';
import OrderStatusBadge from './OrderStatusBadge';

const BackLink = () => (
  <Link href="/compte/commandes" className="block text-sm text-jardinerie-primary underline">
    ← Retour à mes commandes
  </Link>
);

export default function OrderDetail() {
  const { id } = useParams();
  const { data, loading, error, notFound } = useAccountData(accountService.buildOrderUrl(id));

  if (loading) return <LoadingState message="Chargement de votre commande..." />;

  if (notFound || (!error && !data?.order)) {
    return (
      <div className="space-y-4 rounded-xl border border-red-100 bg-red-50 p-6 text-center">
        <p role="alert" className="text-red-600">Commande introuvable.</p>
        <BackLink />
      </div>
    );
  }
  if (error) return <ErrorState message={error} />;

  const order = data.order;
  const subtotal = Number(order.total_amount_tax_incl);
  const shipping = Number(order.shipping_cost_tax_incl);

  return (
    <>
      <BackLink />

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-jardinerie-text">{order.order_reference}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(order.order_date)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="self-start px-4 py-1.5 text-sm" />
      </div>

      <section aria-labelledby="order-items" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <h2 id="order-items" className="border-b border-gray-100 bg-jardinerie-bg px-5 py-3 text-sm font-bold uppercase tracking-wide text-jardinerie-text">
          Articles
        </h2>
        <ul className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-4 p-4">
              <img
                src={item.main_image_url ? resolveAssetUrl(item.main_image_url) : placeholderImg.src}
                alt={item.product_name}
                onError={(event) => { event.target.onerror = null; event.target.src = placeholderImg.src; }}
                className="h-14 w-14 rounded-lg border border-gray-100 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-jardinerie-text">{item.product_name}</p>
                <p className="text-sm text-gray-500">Qté : {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{formatEuro(item.unit_price_tax_incl)} / unité</p>
                <p className="font-bold text-jardinerie-primary">{formatEuro(Number(item.unit_price_tax_incl) * item.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Totaux" className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span>Sous-total TTC</span>
          <span>{formatEuro(subtotal)}</span>
        </div>
        <div className="mb-3 flex justify-between text-sm text-gray-600">
          <span>Livraison ({order.delivery_method})</span>
          <span>{shipping === 0 ? 'Gratuite' : formatEuro(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-jardinerie-primary pt-3 text-lg font-bold text-jardinerie-primary">
          <span>Total payé</span>
          <span>{formatEuro(subtotal + shipping)}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Adresse de livraison</h2>
          <p className="text-sm text-jardinerie-text">{order.shipping_address_text}</p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Adresse de facturation</h2>
          <p className="text-sm text-jardinerie-text">{order.billing_address_text}</p>
        </section>
      </div>
    </>
  );
}
