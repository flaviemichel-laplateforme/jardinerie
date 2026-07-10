import { useState } from 'react';

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
  const [viewingOrder, setViewingOrder] = useState(null);

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
              orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-jardinerie-text">{order.order_reference}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(order.order_date)}</td>
                  <td className="px-4 py-3 text-right font-bold text-jardinerie-primary">{formatAmount(order.total_amount_tax_incl)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingOrder(order)}
                        className="rounded-lg bg-jardinerie-bg px-3 py-1.5 text-xs font-medium text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white transition-colors"
                      >
                        Voir détails
                      </button>
                      <select
                        value={order.status}
                        disabled={statusLoading}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
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

      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setViewingOrder(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-jardinerie-text mb-4">
              Commande {viewingOrder.order_reference}
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium text-jardinerie-text">{formatDate(viewingOrder.order_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Montant TTC</dt>
                <dd className="font-medium text-jardinerie-text">{formatAmount(viewingOrder.total_amount_tax_incl)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Statut</dt>
                <dd className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[viewingOrder.status]}`}>
                  {STATUS_LABELS[viewingOrder.status] ?? viewingOrder.status}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setViewingOrder(null)}
              className="mt-6 w-full rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
