import Link from 'next/link';
import { ShoppingCart, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST, formatEuro } from '../../constants/shipping';

// Seuil à partir duquel on indique la quantité restante (le badge de stock dit déjà « Stock faible »)
const LOW_STOCK_THRESHOLD = 5;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2';

/**
 * Bloc d'achat de la fiche produit : livraison, stock, total, sélecteur de quantité et bouton d'ajout.
 * Placé juste sous le titre et le prix pour être visible dès le premier écran.
 * Sous lg, le sélecteur, le total et le bouton sont dans la barre d'achat collée en bas de la page : ici ne restent
 * que les informations (livraison, stock, panier).
 *
 * @param {number} quantity - Quantité choisie
 * @param {(delta: number) => void} onQuantityChange - Ajoute ou retire `delta` à la quantité (borné par le stock)
 * @param {number} stockQuantity - Stock disponible
 * @param {string} totalPrice - Prix total TTC déjà formaté (prix × quantité)
 * @param {boolean} getsFreeShipping - La commande atteindrait-elle la livraison offerte ?
 * @param {number} cartQuantity - Quantité de ce produit déjà dans le panier
 * @param {() => void} onAddToCart - Ajoute au panier
 */
export default function ProductPurchasePanel({
  quantity,
  onQuantityChange,
  stockQuantity,
  totalPrice,
  getsFreeShipping,
  cartQuantity,
  onAddToCart,
}) {
  const inStock = stockQuantity > 0;

  return (
    <div
      className="border-t border-gray-100 bg-white px-4 py-6 md:mb-6 md:rounded-lg md:border md:border-gray-200 md:p-6 md:shadow-sm"
    >
      {/* Livraison : information fixe tant que le seuil n'est pas atteint, puis confirmation dès que le panier
          (contenu actuel + quantité choisie) donne droit à la livraison offerte. */}
      <p className={`mb-4 flex items-center gap-2 text-sm ${getsFreeShipping ? 'font-bold text-jardinerie-primary' : 'text-gray-500'}`}>
        <Truck size={16} className="shrink-0" aria-hidden="true" />
        {getsFreeShipping
          ? 'Livraison offerte pour cette commande'
          : `Livraison offerte dès ${FREE_SHIPPING_THRESHOLD} € d'achat · sinon ${formatEuro(SHIPPING_COST)}`}
      </p>

      {inStock && stockQuantity <= LOW_STOCK_THRESHOLD && (
        <p className="mb-4 text-sm font-medium text-amber-700">Plus que {stockQuantity} en stock</p>
      )}

      {cartQuantity > 0 && (
        <p className="mb-4 text-sm font-medium text-jardinerie-primary">
          Déjà {cartQuantity} dans votre panier ·{' '}
          <Link href="/panier" className="underline hover:text-green-700">
            Voir le panier
          </Link>
        </p>
      )}

      {/* Le prix unitaire est affiché en haut de la fiche ; ici, le total dès que la quantité dépasse 1 */}
      {quantity > 1 && inStock && (
        <p className="mb-4 hidden items-baseline justify-between text-gray-700 lg:flex">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-xl font-extrabold">{totalPrice} €</span>
        </p>
      )}

      {/* lg et plus seulement : sous lg, ces contrôles sont dans la barre d'achat collée en bas */}
      <div className="hidden items-center gap-3 lg:flex">
        {inStock && (
          <div className="flex shrink-0 items-center rounded-[10px] border border-gray-300">
            <button
              type="button"
              onClick={() => onQuantityChange(-1)}
              aria-label="Diminuer la quantité"
              disabled={quantity <= 1}
              className={`h-12 w-11 rounded-l-[10px] text-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
            >
              −
            </button>
            {/* Zone « live » de la quantité à partir de lg ; sous lg c'est celle de la barre d'achat (l'autre est masquée). */}
            <span aria-live="polite" className="min-w-10 text-center font-medium">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(1)}
              aria-label="Augmenter la quantité"
              disabled={quantity >= stockQuantity}
              className={`h-12 w-11 rounded-r-[10px] text-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 ${focusRing}`}
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onAddToCart}
          disabled={!inStock}
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] px-4 font-bold transition-colors ${focusRing} ${
            inStock ? 'bg-jardinerie-primary text-white hover:bg-green-700' : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
        >
          {inStock && <ShoppingCart size={18} aria-hidden="true" />}
          {inStock ? 'Ajouter au panier' : 'Rupture de stock'}
        </button>
      </div>
    </div>
  );
}
