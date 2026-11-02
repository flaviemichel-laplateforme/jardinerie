import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { resolveAssetUrl } from '../../services/apiClient';
import { productPath } from '../../utils/productUrl';
import { formatEuro } from '../../constants/shipping';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';

/** Une ligne du panier : image, nom, prix, quantité (− / +) et bouton pour retirer l'article. */
export default function CartLine({ item, unavailable = false, onQuantityChange, onRemove }) {
  return (
    <li
      className={`relative flex gap-4 rounded-[20px] border bg-white p-4 shadow-sm ${
        unavailable ? 'border-red-200 bg-red-50/40' : 'border-gray-100'
      }`}
    >
      <Link href={productPath(item)} className="shrink-0" aria-label={`Voir la fiche de ${item.name}`}>
        <img
          src={item.image ? resolveAssetUrl(item.image) : placeholderImg.src}
          alt=""
          onError={(event) => { event.target.onerror = null; event.target.src = placeholderImg.src; }}
          className={`h-20 w-20 rounded-lg border border-gray-100 bg-gray-50 object-cover sm:h-24 sm:w-24 ${unavailable ? 'opacity-50' : ''}`}
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="pr-8">
          <h3 className="text-sm font-bold leading-tight text-jardinerie-text sm:text-base">
            <Link href={productPath(item)}>{item.name}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">RÉF-{String(item.id).padStart(6, '0')}</p>
          {unavailable && (
            <p className="mt-1 text-xs font-bold text-red-600">Cet article n&apos;est plus disponible : retirez-le pour continuer.</p>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <p className="text-lg font-black text-jardinerie-primary">{formatEuro(item.price)}</p>

          <div className={`flex h-8 items-center rounded-full border border-gray-200 bg-white ${unavailable ? 'opacity-40' : ''}`}>
            <button
              type="button"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={unavailable || item.quantity <= 1}
              aria-label={`Diminuer la quantité de ${item.name}`}
              className="px-3 text-jardinerie-text hover:text-jardinerie-primary disabled:opacity-30"
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="w-6 text-center text-sm font-medium text-jardinerie-text" aria-label={`Quantité : ${item.quantity}`}>
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              disabled={unavailable || item.quantity >= item.stock_max}
              aria-label={`Augmenter la quantité de ${item.name}`}
              className="px-3 text-jardinerie-text hover:text-jardinerie-primary disabled:opacity-30"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label={`Retirer ${item.name} du panier`}
        className="absolute right-4 top-4 rounded-lg p-1 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </button>
    </li>
  );
}
