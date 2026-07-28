import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../../components/ui/Spinner';
import { userService } from '../../services/userService';
import { ORDER_STATUS_CONFIG } from '../../constants/orderStatus';

const quickLinks = [
  { label: 'Mes commandes', path: '/compte/commandes', icon: '📦' },
  { label: 'Mes adresses',  path: '/compte/adresses',  icon: '📍' },
  { label: 'Mon profil',    path: '/compte/parametres', icon: '👤' },
  { label: 'RGPD',          path: '/compte/rgpd',       icon: '🔒' },
];

export default function CustomerDashboard() {
  const { data, loading, error, request } = useApi();

  useEffect(() => {
    const controller = new AbortController();
    request(
      userService.buildDashboardUrl(),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request]);

  if (loading) return <Spinner message="Chargement du tableau de bord..." />;

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-center text-red-600">
        Une erreur est survenue lors du chargement.
      </div>
    );
  }

  const { user, total_orders, last_order } = data ?? {};

  const lastOrderDate = last_order
    ? new Date(last_order.order_date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : null;

  const lastOrderTotal = last_order
    ? (parseFloat(last_order.total_amount_tax_incl) + parseFloat(last_order.shipping_cost_tax_incl))
        .toFixed(2).replace('.', ',')
    : null;

  const lastOrderStatus = last_order
    ? (ORDER_STATUS_CONFIG[last_order.status] ?? { label: last_order.status, color: 'bg-gray-100 text-gray-600' })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* ── Bienvenue ── */}
      <div className="rounded-xl bg-jardinerie-primary p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          Bonjour, {user?.first_name} 🌱
        </h1>
        <p className="text-white/80 text-sm">{user?.email}</p>
      </div>

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Nombre de commandes */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500 mb-1">Total de commandes</p>
          <p className="text-3xl font-black text-jardinerie-primary">{total_orders ?? 0}</p>
          <Link
            to="/compte/commandes"
            className="mt-3 inline-block text-xs font-medium text-jardinerie-primary underline"
          >
            Voir toutes mes commandes →
          </Link>
        </div>

        {/* Dernière commande */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500 mb-2">Dernière commande</p>
          {last_order ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-jardinerie-text text-sm">
                  {last_order.order_reference}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${lastOrderStatus.color}`}>
                  {lastOrderStatus.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{lastOrderDate}</p>
              <p className="text-lg font-black text-jardinerie-primary">{lastOrderTotal} €</p>
              <Link
                to={`/compte/commandes/${last_order.id}`}
                className="mt-2 inline-block text-xs font-medium text-jardinerie-primary underline"
              >
                Voir le détail →
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune commande pour le moment.</p>
          )}
        </div>

      </div>

      {/* ── Liens rapides ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Accès rapide
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 text-center hover:border-jardinerie-primary hover:bg-jardinerie-bg transition-all"
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs font-medium text-jardinerie-text">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}