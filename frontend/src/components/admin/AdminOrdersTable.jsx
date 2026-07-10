import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../ui/Spinner';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_LABELS = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatAmount = (amount) =>
  `${parseFloat(amount).toFixed(2).replace('.', ',')} €`;

export default function AdminOrdersTable({ orders, onStatusChange, statusLoading }) {
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const { data: detailData, loading: detailLoading, request: detailRequest } = useApi();

  const handleViewDetails = (orderId) => {
    setViewingOrderId(orderId);
    detailRequest(adminService.buildOrderDetailUrl(orderId), buildRequestOptions());
  };

  const order = detailData?.order;
  const items = detailData?.items ?? [];

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-jardinerie-bg border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Référence</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide hidden md:table-cell">Date</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Montant TTC</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Statut</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 italic">Aucune commande trouvée.</td>
              </tr>
            ) : (
              orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-jardinerie-text">{o.order_reference}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(o.order_date)}</td>
                  <td className="px-4 py-3 text-right font-bold text-jardinerie-primary">{formatAmount(o.total_amount_tax_incl)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(o.id)}
                        className="rounded-lg bg-jardinerie-bg px-3 py-1.5 text-xs font-medium text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white transition-colors"
                      >
                        Voir détails
                      </button>
                      <select
                        value={o.status}
                        disabled={statusLoading}
                        onChange={(e) => onStatusChange(o.id, e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-jardinerie-text disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingOrderId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setViewingOrderId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !order ? (
              <Spinner message="Chargement du détail..." />
            ) : (
              <>
                <h3 className="text-lg font-bold text-jardinerie-text mb-4">
                  Commande {order.order_reference}
                </h3>

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Date</dt>
                    <dd className="font-medium text-jardinerie-text">{formatDate(order.order_date)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Montant TTC</dt>
                    <dd className="font-medium text-jardinerie-text">{formatAmount(order.total_amount_tax_incl)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Statut</dt>
                    <dd className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </dd>
                  </div>
                </dl>

                <hr className="my-4 border-gray-100" />

                <h4 className="text-xs font-bold text-jardinerie-text uppercase tracking-wide mb-2">Client</h4>
                <p className="text-sm text-jardinerie-text">
                  {order.customer_first_name} {order.customer_last_name}
                </p>
                <p className="text-sm text-gray-500">{order.customer_email}</p>

                <h4 className="text-xs font-bold text-jardinerie-text uppercase tracking-wide mt-4 mb-2">Livraison</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{order.shipping_address_text}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {order.delivery_method} · {order.payment_method}
                </p>

                <h4 className="text-xs font-bold text-jardinerie-text uppercase tracking-wide mt-4 mb-2">Articles</h4>
                <ul className="divide-y divide-gray-100">
                  {items.map(item => (
                    <li key={item.product_id} className="flex justify-between py-2 text-sm">
                      <span className="text-jardinerie-text">
                        {item.product_name} <span className="text-gray-400">× {item.quantity}</span>
                      </span>
                      <span className="font-medium text-jardinerie-text">
                        {formatAmount(item.unit_price_tax_incl * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setViewingOrderId(null)}
                  className="mt-6 w-full rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
