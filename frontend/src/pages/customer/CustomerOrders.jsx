import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { orderService } from '../../services/orderService';
import { buildRequestOptions } from '../../services/apiClient';

const statusConfig = {
  paid:      { label: 'Payée',     color: 'bg-green-100 text-green-700' },
  pending:   { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  shipped:   { label: 'Expédiée',  color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Livrée',    color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Annulée',   color: 'bg-red-100 text-red-600' },
};

export default function CustomerOrders() {
  const { data, loading, error, request } = useApi();
  const orders = data?.orders ?? [];

  useEffect(() => {
    const controller = new AbortController();
    request(
      orderService.buildListUrl(),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-jardinerie-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-center text-red-600">
        Une erreur est survenue lors du chargement de vos commandes.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-jardinerie-text mb-6">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-jardinerie-bg border border-jardinerie-primary/20 p-10 text-center">
          <p className="text-jardinerie-text/70 mb-4">Vous n'avez pas encore passé de commande.</p>
          <Link
            to="/vegetaux"
            className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white"
          >
            Découvrir nos végétaux
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' };
            const date = new Date(order.order_date).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric'
            });
            const total = (parseFloat(order.total_amount_tax_incl) + parseFloat(order.shipping_cost_tax_incl))
              .toFixed(2).replace('.', ',');

            return (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-jardinerie-text">{order.order_reference}</span>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{date}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.items_count} article{order.items_count > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-jardinerie-primary">{total} €</span>
                    <Link
                      to={`/compte/commandes/${order.id}`}
                      className="rounded-full border border-jardinerie-primary px-5 py-2 text-xs font-bold text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white transition-all"
                    >
                      Voir le détail
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}