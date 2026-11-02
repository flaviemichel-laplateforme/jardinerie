// Source unique pour l'affichage des statuts de commande (libellé + couleur), partagée entre l'espace client et,
// plus tard, l'administration pour éviter toute divergence.

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export const ORDER_STATUS_CONFIG = {
  pending:   { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  paid:      { label: 'Payée',      color: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Expédiée',   color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Livrée',     color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée',    color: 'bg-red-100 text-red-700' },
};

export function getOrderStatus(status) {
  return ORDER_STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
}
