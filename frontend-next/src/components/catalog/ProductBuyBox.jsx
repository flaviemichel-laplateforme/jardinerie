'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../../contexts/CartContext';
import { productService } from '../../services/productService';
import { FREE_SHIPPING_THRESHOLD } from '../../constants/shipping';
import StockBadge from '../ui/StockBadge';
import ProductPurchasePanel from './ProductPurchasePanel';

/**
 * Partie interactive de la fiche produit : titre, prix, stock en temps réel, quantité et ajout au panier,
 * plus la barre d'achat collée en bas de l'écran sur mobile.
 * Le titre et le prix sont quand même dans le HTML envoyé par le serveur (un composant client est aussi rendu
 * sur le serveur) ; seul le stock en temps réel est vérifié ensuite, dans le navigateur.
 *
 * À monter avec `key={product.id}` : changer de produit remet la quantité à 1.
 *
 * @param {object} product - Champs utiles à l'achat (id, product_name, price_tax_incl, stock_quantity, sku…)
 */
export default function ProductBuyBox({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [realTimeStock, setRealTimeStock] = useState(null);
  const { addToCart, cartItems, cartTotal } = useCart();

  // Vérifie le stock en temps réel (silencieux : pas de notification ni de spinner). Le stock reçu du serveur
  // peut dater d'une minute (cache) : celui-ci est exact au moment de l'achat.
  useEffect(() => {
    const controller = new AbortController();

    fetch(productService.buildAvailabilityUrl(product.id), { signal: controller.signal })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) setRealTimeStock(result.data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Impossible de vérifier le stock en temps réel', err);
      });

    return () => controller.abort();
  }, [product.id]);

  const currentStockQty = realTimeStock ? realTimeStock.stock_quantity : (product.stock_quantity || 0);
  const currentStockStatus = realTimeStock ? realTimeStock.status : null;

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentStockQty) return currentStockQty;
      return next;
    });
  };

  // Référence affichée : le SKU saisi dans l'administration, sinon l'ancienne référence calculée
  const productRef = product.sku || `REF-JARD-${String(product.id).padStart(5, '0')}`;
  const cartQuantity = cartItems.find((item) => item.id === product.id)?.quantity ?? 0;

  // Partagé par le bouton du bloc d'achat et par celui de la barre mobile
  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity} ${product.product_name} ajouté(s) au panier !`);
  };

  const totalPrice = (Number(product.price_tax_incl) * quantity).toFixed(2);
  // Avec ce que contient déjà le panier + la quantité choisie, la commande atteindrait-elle la livraison offerte ?
  const getsFreeShipping = cartTotal + Number(product.price_tax_incl) * quantity >= FREE_SHIPPING_THRESHOLD;

  return (
    <>
      {/* Titre, prix et stock. Sous md : sans cadre, marges de 16 px ; à partir de md : carte bordée. */}
      <div className="bg-white px-4 pt-4 md:mb-6 md:rounded-lg md:border md:border-gray-200 md:p-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-jardinerie-text md:text-3xl">
            {product.product_name}
          </h1>
          <div className="mt-1 shrink-0 md:mt-2">
            <StockBadge quantity={currentStockQty} statusOverride={currentStockStatus} />
          </div>
        </div>
        {/* Prix unitaire TTC dès le haut de la fiche : la référence qui ne change pas avec la quantité */}
        <p className="mb-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-jardinerie-primary">
            {Number(product.price_tax_incl).toFixed(2)} €
          </span>
          <span className="text-sm text-gray-500">TTC</span>
        </p>
        <p className="font-mono text-sm text-gray-500">
          Réf : {productRef}
        </p>
      </div>

      {/* Bloc d'achat : juste sous le titre et le prix, visible dès le premier écran sur desktop.
          Sur mobile, il ne garde que les informations : le sélecteur et le bouton sont dans la barre collée en bas. */}
      <ProductPurchasePanel
        quantity={quantity}
        onQuantityChange={handleQtyChange}
        stockQuantity={currentStockQty}
        totalPrice={totalPrice}
        getsFreeShipping={getsFreeShipping}
        cartQuantity={cartQuantity}
        onAddToCart={handleAddToCart}
      />

      {/* Barre d'achat mobile, collée en bas et toujours visible : le bouton est atteignable à tout moment.
          Sur mobile, c'est le seul endroit avec le sélecteur et le bouton (la page n'en a plus : pas de doublon). */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.1)] lg:hidden">
        {/* Contenu centré et limité en largeur : sur tablette (jusqu'à 1023 px), un bouton étiré sur toute la
            largeur serait disproportionné. */}
        <div className="mx-auto w-full max-w-md">
          {/* Ligne du total : isolée à droite, le bouton garde son libellé simple. Masquée en rupture de stock. */}
          {currentStockQty > 0 && (
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-extrabold text-gray-700">{totalPrice} €</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center rounded-[10px] border border-gray-300">
              <button
                type="button"
                onClick={() => handleQtyChange(-1)}
                aria-label="Diminuer la quantité"
                disabled={quantity <= 1 || currentStockQty <= 0}
                className="h-12 w-10 text-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary"
              >
                −
              </button>
              <span aria-live="polite" className="min-w-8 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => handleQtyChange(1)}
                aria-label="Augmenter la quantité"
                disabled={quantity >= currentStockQty || currentStockQty <= 0}
                className="h-12 w-10 text-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={currentStockQty <= 0}
              className={`min-h-[48px] flex-1 rounded-[10px] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2 ${
                currentStockQty > 0
                  ? 'bg-jardinerie-primary text-white hover:bg-green-700'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              {currentStockQty > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
