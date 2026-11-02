'use client';

import Link from 'next/link';
import { useAccountData } from '../../hooks/useAccountData';
import { accountService } from '../../services/accountService';
import { formatDate, formatEuro } from '../../utils/format';
import { LoadingState, ErrorState } from './DataState';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrdersList() {
  const { data, loading, error } = useAccountData(accountService.buildOrdersUrl());

  if (loading) return <LoadingState message="Chargement de vos commandes..." />;
  if (error) return <ErrorState message={error} />;

  const orders = data?.orders ?? [];

  return (
    <>
      <h1 className="text-2xl font-bold text-jardinerie-text">Mes commandes</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-jardinerie-primary/20 bg-jardinerie-bg p-10 text-center">
          <p className="mb-4 text-jardinerie-text/70">Vous n&apos;avez pas encore passé de commande.</p>
          <Link href="/vegetaux" className="inline-block rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white hover:bg-green-700">
            Découvrir nos végétaux
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-jardinerie-text">{order.order_reference}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(order.order_date)}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {order.items_count} article{order.items_count > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-jardinerie-primary">
                    {formatEuro(Number(order.total_amount_tax_incl) + Number(order.shipping_cost_tax_incl))}
                  </span>
                  <Link
                    href={`/compte/commandes/${order.id}`}
                    aria-label={`Voir le détail de la commande ${order.order_reference}`}
                    className="rounded-full border border-jardinerie-primary px-5 py-2 text-xs font-bold text-jardinerie-primary transition-all hover:bg-jardinerie-primary hover:text-white"
                  >
                    Voir le détail
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
