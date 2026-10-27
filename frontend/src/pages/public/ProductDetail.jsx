import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import StockBadge from '../../components/ui/StockBadge';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../services/apiClient';
import { useInView } from 'react-intersection-observer';
import { ArrowLeft, Droplet, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST, formatEuro } from '../../constants/shipping';
import { SUN_EXPOSURE_CONFIG, WATER_REQUIREMENT_CONFIG, WATER_COLOR } from '../../constants/plantAttributes';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

// Transforme les URLs présentes dans un texte libre en vrais liens cliquables.
function linkify(text) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-jardinerie-primary underline hover:text-green-700"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: product, loading, error, request } = useApi();

  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [realTimeStock, setRealTimeStock] = useState(null);

  const { addToCart, cartItems, cartTotal } = useCart();

  // Le bloc d'achat de la page est-il à l'écran ? Sur mobile, la barre d'achat collée en bas ne s'affiche
  // que lorsqu'il est hors écran, pour ne jamais montrer deux boutons identiques en même temps.
  // rootMargin négatif en haut : le header collant (~140 px sur mobile) masque le haut de l'écran, un bloc
  // glissé dessous ne doit plus compter comme visible.
  const { ref: buyBoxRef, inView: isBuyBoxVisible } = useInView({ threshold: 0, rootMargin: '-140px 0px 0px 0px' });

  // Repère invisible juste après le bloc d'achat. Quand il est à l'écran alors que le bloc ne l'est pas,
  // on l'a dépassé (on est vers le footer) : la barre ne ferait alors que recouvrir le bas de la page.
  const { ref: afterBuyBoxRef, inView: isAfterBuyBoxVisible } = useInView({ threshold: 0 });
  const showMobileBuyBar = !isBuyBoxVisible && !isAfterBuyBoxVisible;

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
    setSelectedThumbnail(null);
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

  const galleryImages = [product.main_image_url, product.secondary_image_url]
    .filter(Boolean)
    .map(path => getImageUrl(path));
  
  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);

  const activeImage = selectedThumbnail || (product.main_image_url ? getImageUrl(product.main_image_url) : FALLBACK_IMAGE);
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
    // pb-36 sur mobile : laisse la place à la barre d'achat collée en bas (~110 px)
    <article className="mx-auto max-w-7xl px-6 py-8 pb-36 lg:pb-8">

      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-jardinerie-primary px-4 py-2 text-sm font-bold text-jardinerie-text transition-colors hover:bg-jardinerie-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Retour
      </button>

      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">
        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <Link to={product.plant_id ? '/vegetaux' : '/jardinage'} className="hover:text-jardinerie-primary hover:underline">{product.category_name}</Link>
        {product.subcategory_name && (
          <>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3] relative flex items-center justify-center group">
            <img 
              src={activeImage} 
              alt={product.product_name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-contain p-4 transition-opacity duration-300"
            />
          </div>

          {galleryImages.length > 0 && (
            <div className="flex gap-4 justify-center">
              {galleryImages.map((imgUrl, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedThumbnail(imgUrl)}
                  className={`w-24 h-24 rounded-lg overflow-hidden border-2 bg-white transition-all ${
                    activeImage === imgUrl ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            
            <div className="flex justify-between items-start mb-2 gap-4">
              <h1 className="text-3xl font-bold text-jardinerie-text">
                {product.product_name}
              </h1>
              <div className="mt-2 shrink-0">
                <StockBadge quantity={currentStockQty} statusOverride={currentStockStatus} />
              </div>
            </div>

            <p className="text-sm text-gray-500 font-mono">
              Réf : {productRef}
            </p>
          </div>

          {(product.plant_id || product.description) && (
            <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
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
                <div className="text-gray-600 leading-relaxed">
                  {product.description.split('•').map((part, index) => {
                    const trimmed = part.trim();
                    if (!trimmed) return null;

                    // Le premier segment (avant la première puce) contient plusieurs informations
                    // du type "Label : valeur." collées à la suite (Type de Sol, Rusticité, Arrosage...).
                    // On fait démarrer chacune sur sa propre ligne, à chaque fois qu'un nouveau label est détecté.
                    if (index === 0) {
                      const lines = trimmed.split(/(?<=\.)\s+(?=[A-ZÀ-Ü][^.:]{1,30}:)/);
                      return (
                        <div key={index} className="mb-3 space-y-1.5">
                          {lines.map((line, lineIndex) => (
                            <p key={lineIndex}>{linkify(line.trim())}</p>
                          ))}
                        </div>
                      );
                    }

                    // Les segments suivants (Conseils, Maladies et ravageurs...) deviennent des points distincts.
                    return (
                      <p key={index} className="flex gap-2 mb-1.5 text-sm">
                        <span className="text-jardinerie-primary shrink-0">•</span>
                        <span>{linkify(trimmed)}</span>
                      </p>
                    );
                  })}
                </div>
              )}

              {product.plant_id && product.latin_name && (
                <p className="mt-2 text-sm text-gray-500">
                  <i className="font-serif">{product.latin_name}</i>
                  {product.genus && ` (${product.genus} ${product.species || ''})`}
                </p>
              )}
            </div>
          )}

          {/* Bloc d'achat (observé pour savoir quand afficher la barre d'achat mobile) */}
          <div
            ref={buyBoxRef}
            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]"
          >
             <div className="text-3xl font-extrabold text-gray-600 mb-2">
              {Number(product.price_tax_incl).toFixed(2)} €
            </div>

            {/* Livraison : information fixe tant que le seuil n'est pas atteint, puis confirmation dès que le
                panier (contenu actuel + quantité choisie) donne droit à la livraison offerte. */}
            <p
              className={`mb-8 flex items-center justify-center gap-2 text-center text-sm ${
                getsFreeShipping ? 'font-bold text-jardinerie-primary' : 'text-gray-500'
              }`}
            >
              <Truck size={16} className="shrink-0" aria-hidden="true" />
              {getsFreeShipping
                ? 'Livraison offerte pour cette commande'
                : `Livraison offerte dès ${FREE_SHIPPING_THRESHOLD} € d'achat · sinon ${formatEuro(SHIPPING_COST)}`}
            </p>

            {cartQuantity > 0 && (
              <p className="text-sm text-jardinerie-primary font-medium mb-3">
                Déjà {cartQuantity} dans votre panier
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">

              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button
                  onClick={() => handleQtyChange(-1)}
                  aria-label="Diminuer la quantité"
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  disabled={quantity <= 1 || currentStockQty <= 0}
                >-</button>
                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => handleQtyChange(1)}
                  aria-label="Augmenter la quantité"
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  disabled={quantity >= currentStockQty || currentStockQty <= 0}
                >+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 min-w-[200px] py-3.5 rounded-md font-bold text-lg transition-colors ${
                  currentStockQty > 0 
                    ? 'bg-jardinerie-primary text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={currentStockQty <= 0}
              >
                {currentStockQty > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={afterBuyBoxRef} aria-hidden="true" />

      {/* Barre d'achat mobile, collée en bas, visible seulement tant que le bloc d'achat de la page est
          encore à venir. Le sélecteur partage la même quantité que celui de la page, et le prix du bouton
          suit la quantité. */}
      {showMobileBuyBar && (
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
      )}

    </article>
  );
}