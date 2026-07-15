import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../../components/ui/Spinner';
import AdminClientsTable from '../../components/admin/AdminClientsTable';

const ROLE_FILTERS = ['tous', 'customer', 'admin'];

const ROLE_FILTER_LABELS = {
  tous: 'Tous',
  customer: 'Clients',
  admin: 'Administrateurs',
};

export default function AdminClients() {
  const { data, loading, request } = useApi();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState('tous');
  const [page, setPage] = useState(1);

  const clients = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    const controller = new AbortController();
    request(
      adminService.buildClientsListUrl(debouncedSearch, roleFilter, page, 10),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request, debouncedSearch, roleFilter, page]);

  if (loading) return <Spinner message="Chargement des clients..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-jardinerie-text">Gestion des clients</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination?.total_items ?? 0} compte{pagination?.total_items > 1 ? 's' : ''} au total
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jardinerie-primary"
        />
        <div className="flex gap-2">
          {ROLE_FILTERS.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-jardinerie-primary text-white'
                  : 'bg-jardinerie-bg text-jardinerie-text hover:bg-gray-200'
              }`}
            >
              {ROLE_FILTER_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <AdminClientsTable clients={clients} />

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
