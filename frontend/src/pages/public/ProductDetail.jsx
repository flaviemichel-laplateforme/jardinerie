import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import StockBadge from '../../components/ui/StockBadge';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../services/apiClient';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, loading, error, request } = useApi();

  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullBotanical, setShowFullBotanical] = useState(false);
  const [realTimeStock, setRealTimeStock] = useState(null);

  const { addToCart } = useCart();

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
    setShowFullBotanical(false);
    setRealTimeStock(null);
  }

  const currentStockQty = realTimeStock ? realTimeStock.stock_quantity : (product?.stock_quantity || 0);
  const currentStockStatus = realTimeStock ? realTimeStock.status : null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    return resolveAssetUrl(imagePath);
  };

  const translateLabel = (val) => {
    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };
    return dict[val] || val;
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

  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      
      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">
        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <Link to="/vegetaux" className="hover:text-jardinerie-primary hover:underline">{product.category_name}</Link>
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

          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">
             <div className="text-3xl font-extrabold text-gray-600 mb-8">
              {Number(product.price_tax_incl).toFixed(2)} €
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button 
                  onClick={() => handleQtyChange(-1)} 
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" 
                  disabled={quantity <= 1 || currentStockQty <= 0}
                >-</button>
                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>
                <button 
                  onClick={() => handleQtyChange(1)} 
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" 
                  disabled={quantity >= currentStockQty || currentStockQty <= 0}
                >+</button>
              </div>

              <button 
                onClick={() => {
                  addToCart(product, quantity);
                  toast.success(`${quantity} ${product.product_name} ajouté(s) au panier !`);
                }}
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

      <section className="border border-gray-200 rounded-lg p-8 mb-12 bg-white text-center">
        <h2 className="text-xl font-bold text-jardinerie-text mb-6">Caractéristiques de la plante</h2>
        
        <div className="flex justify-center gap-12 mb-6 text-gray-700">
          {product.sun_exposure && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition ☀️</span>
              <span className="font-medium text-lg"> {translateLabel(product.sun_exposure)}</span>
            </div>
          )}
          {product.water_requirement && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage💧</span>
              <span className="font-medium text-lg"> {translateLabel(product.water_requirement)}</span>
            </div>
          )}
        </div>

        {showFullBotanical && (
          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-6 border-t border-gray-100 pt-6">
            <p className="mb-4 text-lg leading-relaxed"><strong>Description :</strong> {product.description}</p>
            {product.latin_name && (
              <p className="text-lg">
                <strong>Nom Latin :</strong> <i className="font-serif">{product.latin_name}</i>
                {product.genus && ` (${product.genus} ${product.species || ''})`}
              </p>
            )}
          </div>
        )}

        <button 
          onClick={() => setShowFullBotanical(!showFullBotanical)}
          className="border border-gray-300 rounded-full px-8 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {showFullBotanical ? 'Réduire' : 'Voir + d\'infos'}
        </button>
      </section>

    </article>
  );
}