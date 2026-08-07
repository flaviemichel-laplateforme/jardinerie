import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../../components/ui/Spinner';
import AdminOrdersTable from '../../components/admin/AdminOrdersTable';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_FILTER_LABELS = {
  all: 'Toutes',
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function AdminOrders() {
  const { data, loading, request, setData } = useApi();
  const { loading: statusLoading, request: statusRequest } = useApi();

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const orders = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  useEffect(() => {
    const controller = new AbortController();
    request(
      adminService.buildOrdersListUrl(statusFilter, page, 10),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request, statusFilter, page]);

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await statusRequest(
      adminService.buildOrderStatusUpdateUrl(orderId),
      buildRequestOptions({ method: 'PATCH', body: { status: newStatus } }),
      false
    );

    if (result.success) {
      setData(prev => ({
        ...prev,
        items: prev.items.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
      }));
      toast.success('Statut mis à jour avec succès.');
    } else {
      toast.error(result.error || 'Une erreur est survenue.');
    }
  };

  if (loading && !data) return <Spinner message="Chargement des commandes..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-jardinerie-text">Gestion des commandes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination?.total_items ?? 0} commande{pagination?.total_items > 1 ? 's' : ''} au total
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map(status => (
          <button
            key={status}
            type="button"
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-jardinerie-primary text-white'
                : 'bg-jardinerie-bg text-jardinerie-text hover:bg-gray-200'
            }`}
          >
            {STATUS_FILTER_LABELS[status]}
          </button>
        ))}
      </div>

      <AdminOrdersTable
        orders={orders}
        onStatusChange={handleStatusChange}
        statusLoading={statusLoading}
      />

      {pagination && (
        <div className="flex justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={!pagination.has_prev}
            onClick={() => setPage(p => p - 1)}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-jardinerie-primary text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:hover:bg-jardinerie-primary"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500 self-center">
            Page {pagination.current_page} / {pagination.total_pages}
          </span>
          <button
            type="button"
            disabled={!pagination.has_next}
            onClick={() => setPage(p => p + 1)}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-jardinerie-primary text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:hover:bg-jardinerie-primary"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
