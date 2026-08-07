import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { orderService } from '../../services/orderService';
import { buildRequestOptions, resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';
import Spinner from '../../components/ui/Spinner';
import { ORDER_STATUS_CONFIG } from '../../constants/orderStatus';

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const { data, loading, error, request } = useApi();
  const order = data?.order ?? null;

  useEffect(() => {
    const controller = new AbortController();
    request(
      orderService.buildDetailUrl(id),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request, id]);

  if (loading) {
    return <Spinner message='Chargement de votre commande...' />;
  }

  if (error || !order) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-center">
        <p className="text-red-600 mb-4">Commande introuvable.</p>
        <Link to="/compte/commandes" className="text-jardinerie-primary underline text-sm">
          ← Retour à mes commandes
        </Link>
      </div>
    );
  }

  const status = ORDER_STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' };
  const date = new Date(order.order_date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const shippingCost = parseFloat(order.shipping_cost_tax_incl);
  const total = parseFloat(order.total_amount_tax_incl);
  const grandTotal = (total + shippingCost).toFixed(2).replace('.', ',');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <Link to="/compte/commandes" className="text-sm text-jardinerie-primary underline mb-6 block">
        ← Retour à mes commandes
      </Link>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-jardinerie-text">{order.order_reference}</h1>
          <p className="text-sm text-gray-500 mt-1">{date}</p>
        </div>
        <span className={`self-start rounded-full px-4 py-1.5 text-sm font-bold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Articles */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-5">
        <div className="px-5 py-3 bg-jardinerie-bg border-b border-gray-100">
          <h2 className="text-sm font-bold text-jardinerie-text uppercase tracking-wide">Articles</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-4 p-4">
              <img
                src={item.main_image_url ? resolveAssetUrl(item.main_image_url) : placeholderImg}
                alt={item.product_name}
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg; }}
                className="h-14 w-14 rounded-lg object-cover border border-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-jardinerie-text truncate">{item.product_name}</p>
                <p className="text-sm text-gray-500">Qté : {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{parseFloat(item.unit_price_tax_incl).toFixed(2).replace('.', ',')} € / unité</p>
                <p className="font-bold text-jardinerie-primary">
                  {(parseFloat(item.unit_price_tax_incl) * item.quantity).toFixed(2).replace('.', ',')} €
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totaux */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Sous-total TTC</span>
          <span>{total.toFixed(2).replace('.', ',')} €</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span>Livraison ({order.delivery_method})</span>
          <span>{shippingCost === 0 ? 'Gratuite' : `${shippingCost.toFixed(2).replace('.', ',')} €`}</span>
        </div>
        <div className="flex justify-between font-bold text-jardinerie-primary text-lg border-t border-jardinerie-primary pt-3">
          <span>Total payé</span>
          <span>{grandTotal} €</span>
        </div>
      </div>

      {/* Adresses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Adresse de livraison</h3>
          <p className="text-sm text-jardinerie-text">{order.shipping_address_text}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Adresse de facturation</h3>
          <p className="text-sm text-jardinerie-text">{order.billing_address_text}</p>
        </div>
      </div>

    </div>
  );
}