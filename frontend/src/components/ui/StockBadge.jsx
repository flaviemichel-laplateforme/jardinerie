export default function StockBadge({ quantity, statusOverride }) {
  // Détermination du statut basé sur l'override (API) ou la quantité brute
  let text = 'En stock';
  let colorClass = 'bg-green-100 text-green-700 border-green-200';

  if (statusOverride === 'indisponible' || quantity <= 0) {
    text = 'Épuisé';
    colorClass = 'bg-red-100 text-red-700 border-red-200';
  } else if (statusOverride === 'stock faible' || (quantity > 0 && quantity <= 5)) {
    text = 'Stock faible';
    colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
  }

  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm ${colorClass}`}>
      {text}
    </span>
  );
}