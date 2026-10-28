import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import StockBadge from '../../components/ui/StockBadge';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ProductGallery from '../../components/catalog/ProductGallery';
import ProductPurchasePanel from '../../components/catalog/ProductPurchasePanel';
import ProductDescription from '../../components/catalog/ProductDescription';
import { parseProductDescription } from '../../utils/parseProductDescription';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../services/apiClient';
import { ArrowLeft, Droplet } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD } from '../../constants/shipping';
import { SUN_EXPOSURE_CONFIG, WATER_REQUIREMENT_CONFIG, WATER_COLOR } from '../../constants/plantAttributes';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: product, loading, error, request } = useApi();

  const [quantity, setQuantity] = useState(1);
  const [realTimeStock, setRealTimeStock] = useState(null);

  const { addToCart, cartItems, cartTotal } = useCart();

  // Requête principale : récupère la fiche produit
  useEffect(() => {
    const controller = new AbortController();
    request(productService.buildProductDetailUrl(id), { signal: controller.signal }, true);
    return () => controller.abort();
  }, [id, request]);

  // Requête secondaire : vérifie le stock en temps réel (silencieuse, pas de toast/spinner)
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchAvailability = async () => {
      try {
        const response = await fetch(productService.buildAvailabilityUrl(id), { signal: controller.signal });
        const result = await response.json();
        
        if (result.success) {
          setRealTimeStock(result.data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Impossible de vérifier le stock en temps réel", err);
        }
      }
    };

    fetchAvailability();
    return () => controller.abort();
  }, [id]);

  // Réinitialisation des états locaux si l'id change (navigation entre 2 fiches produit)
  const [currentId, setCurrentId] = useState(id);

  if (id !== currentId) {
    setCurrentId(id);
    setQuantity(1);
    setRealTimeStock(null);
  }

  const currentStockQty = realTimeStock ? realTimeStock.stock_quantity : (product?.stock_quantity || 0);
  const currentStockStatus = realTimeStock ? realTimeStock.status : null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    return resolveAssetUrl(imagePath);
  };

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentStockQty) return currentStockQty;
      return next;
    });
  };

  if (loading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 flex justify-center">
        <div className="h-[600px] w-full animate-pulse bg-gray-50 rounded-lg border border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg border border-red-100">
          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>
          <p className="mb-6">{error}</p>
          <button onClick={() => navigate('/vegetaux')} className="bg-jardinerie-primary text-white px-6 py-3 rounded hover:bg-green-700 transition-colors">
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  // Photos de la galerie, avec un texte alternatif utile pour chacune
  const galleryImages = [product.main_image_url, product.secondary_image_url]
    .filter(Boolean)
    .map((path, index) => ({
      url: getImageUrl(path),
      alt: index === 0 ? product.product_name : `${product.product_name} — vue ${index + 1}`,
    }));

  if (galleryImages.length === 0) galleryImages.push({ url: FALLBACK_IMAGE, alt: product.product_name });

  // Fil d'Ariane : une étape sans lien (la sous-catégorie, quand elle existe) est la page courante
  const breadcrumbItems = [
    { label: 'Accueil', to: '/' },
    { label: product.category_name, to: product.plant_id ? '/vegetaux' : '/jardinage' },
    ...(product.subcategory_name ? [{ label: product.subcategory_name }] : []),
  ];

  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;

  // Retour à la page d'où l'on vient (catalogue avec ses filtres, accueil...). Si la fiche a été ouverte
  // directement (lien partagé, nouvel onglet), il n'y a pas d'historique : on renvoie vers le bon catalogue.
  // location.key vaut 'default' uniquement sur la toute première page chargée.
  const handleBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(product.plant_id ? '/vegetaux' : '/jardinage');
  };
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
    // Sous md : pleine largeur (-mx-6 annule le retrait p-6 de <main>, -mt-6 le retrait du haut). La place de la barre
    // d'achat collée en bas n'est pas réservée ici mais dans le pied de page (voir MainLayout), sinon le vide s'additionne.
    // À partir de md : mise en page centrée habituelle.
    <article className="-mx-6 -mt-6 md:mx-auto md:mt-0 md:max-w-7xl md:px-6 md:py-8">

      {/* md et plus : bouton Retour libellé. Sur mobile, un bouton rond est posé sur la galerie (voir plus bas). */}
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 hidden items-center gap-2 rounded-full border border-jardinerie-primary px-4 py-2 text-sm font-bold text-jardinerie-text transition-colors hover:bg-jardinerie-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2 md:inline-flex"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Retour
      </button>

      <div className="md:mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 lg:mb-12 lg:grid-cols-2 lg:gap-10">

        <ProductGallery
          key={product.id}
          // lg : la photo reste visible sous le header collant pendant la lecture de la colonne de droite
          className="lg:sticky lg:top-[calc(var(--header-h,140px)+1rem)] lg:self-start"
          images={galleryImages}
          label={product.product_name}
          fallbackUrl={FALLBACK_IMAGE}
          overlay={
            <button
              type="button"
              onClick={handleBack}
              aria-label="Retour"
              className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-jardinerie-text shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary md:hidden"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          }
        />

        <div className="flex flex-col">
          {/* Titre, prix et stock. Sous md : sans cadre, marges de 16 px ; à partir de md : carte bordée. */}
          <div className="bg-white px-4 pt-4 md:mb-6 md:rounded-lg md:border md:border-gray-200 md:p-6">

            <div className="flex justify-between items-start mb-2 gap-4">
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

            <p className="text-sm text-gray-500 font-mono">
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

          {(product.plant_id || product.description) && (
            <div className="border-t border-gray-100 bg-white px-4 py-6 md:mb-6 md:rounded-lg md:border md:border-gray-200 md:p-6">
              {product.plant_id && (product.sun_exposure || product.water_requirement) && (
                <div className="flex flex-wrap gap-x-8 gap-y-4 mb-4 text-gray-700">
                  {product.sun_exposure && (() => {
                    // L'icône change selon l'exposition ; elle est décorative : l'information est portée par le texte.
                    const exposure = SUN_EXPOSURE_CONFIG[product.sun_exposure];
                    return (
                      <div className="flex items-center gap-3">
                        {exposure && (
                          // Même taille de pastille pour l'exposition et l'arrosage : les textes restent alignés
                          <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.18)]" aria-hidden="true">
                            <exposure.Icon size={22} color={exposure.color} />
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition</span>
                          <span className="font-medium text-lg">{exposure?.label ?? product.sun_exposure}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {product.water_requirement && (() => {
                    // Le nombre de gouttes augmente avec le besoin en eau (1, 2 ou 3).
                    const water = WATER_REQUIREMENT_CONFIG[product.water_requirement];
                    return (
                      <div className="flex items-center gap-3">
                        {water && (
                          <span className="flex h-11 w-16 shrink-0 items-center justify-center gap-0.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.18)]" aria-hidden="true">
                            {Array.from({ length: water.drops }, (_, i) => (
                              <Droplet key={i} size={18} color={WATER_COLOR} fill={WATER_COLOR} fillOpacity={0.25} />
                            ))}
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage</span>
                          <span className="font-medium text-lg">{water?.label ?? product.water_requirement}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {product.description && (
                <ProductDescription {...parseProductDescription(product.description, product.latin_name)} />
              )}

              {product.plant_id && product.latin_name && (
                <p className="mt-2 text-sm text-gray-500">
                  <i className="font-serif">{product.latin_name}</i>
                  {product.genus && ` (${product.genus} ${product.species || ''})`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

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

    </article>
  );
}