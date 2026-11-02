'use client';

import Link from 'next/link';
import { Package, MapPin, User, ShieldCheck } from 'lucide-react';
import { useAccountData } from '../../hooks/useAccountData';
import { accountService } from '../../services/accountService';
import { formatDate, formatEuro } from '../../utils/format';
import { LoadingState, ErrorState } from './DataState';
import OrderStatusBadge from './OrderStatusBadge';

const QUICK_LINKS = [
  { label: 'Mes commandes', href: '/compte/commandes', Icon: Package },
  { label: 'Mes adresses', href: '/compte/adresses', Icon: MapPin },
  { label: 'Mon profil', href: '/compte/parametres', Icon: User },
  { label: 'RGPD', href: '/compte/rgpd', Icon: ShieldCheck },
];

export default function AccountDashboard() {
  const { data, loading, error } = useAccountData(accountService.buildDashboardUrl());

  if (loading) return <LoadingState message="Chargement du tableau de bord..." />;
  if (error) return <ErrorState message={error} />;

  const { user, total_orders: totalOrders, last_order: lastOrder } = data;

  return (
    <>
      <section className="rounded-xl bg-jardinerie-primary p-6 text-white">
        <h1 className="mb-1 text-2xl font-bold">Bonjour, {user?.first_name} 🌱</h1>
        <p className="text-sm text-white/80">{user?.email}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-sm text-gray-500">Total de commandes</h2>
          <p className="text-3xl font-black text-jardinerie-primary">{totalOrders ?? 0}</p>
          <Link href="/compte/commandes" className="mt-3 inline-block text-xs font-medium text-jardinerie-primary underline">
            Voir toutes mes commandes →
          </Link>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm text-gray-500">Dernière commande</h2>
          {lastOrder ? (
            <>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-jardinerie-text">{lastOrder.order_reference}</span>
                <OrderStatusBadge status={lastOrder.status} className="px-2.5 py-0.5 text-xs" />
              </div>
              <p className="mb-1 text-xs text-gray-500">{formatDate(lastOrder.order_date)}</p>
              <p className="text-lg font-black text-jardinerie-primary">
                {formatEuro(Number(lastOrder.total_amount_tax_incl) + Number(lastOrder.shipping_cost_tax_incl))}
              </p>
              <Link href={`/compte/commandes/${lastOrder.id}`} className="mt-2 inline-block text-xs font-medium text-jardinerie-primary underline">
                Voir le détail →
              </Link>
            </>
          ) : (
            <p className="text-sm italic text-gray-500">Aucune commande pour le moment.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Accès rapide</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 text-center transition-all hover:border-jardinerie-primary hover:bg-jardinerie-bg"
            >
              <link.Icon size={24} aria-hidden="true" className="text-jardinerie-primary" />
              <span className="text-xs font-medium text-jardinerie-text">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
