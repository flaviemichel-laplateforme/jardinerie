import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&w=600&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, loading, error, request } = useApi();

  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullBotanical, setShowFullBotanical] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/products/${id}`;
    request(url, { signal: controller.signal }, true);
    return () => controller.abort();
  }, [id, request]);

  useEffect(() => {
    if (product) setActiveImage(product.main_image_url || FALLBACK_IMAGE);
  }, [product]);

  const translateLabel = (val) => {
    const dict = { 'Sun': 'Plein Soleil', 'Partial Shade': 'Mi-ombre', 'Shade': 'Ombre', 'Low': 'Faible', 'Medium': 'Moyen', 'High': 'Élevé' };
    return dict[val] || val;
  };

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product && next > product.stock_quantity) return product.stock_quantity;
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

  const galleryImages = [product.main_image_url, product.secondary_image_url].filter(Boolean);
  if (galleryImages.length === 0) galleryImages.push(FALLBACK_IMAGE);

  // Génération d'une référence factice si elle n'est pas en BDD
  const productRef = `REF-JARD-${String(product.id).padStart(5, '0')}`;

  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      
      {/* 1. FIL D'ARIANE (Wireframe) */}
      <nav className="mb-8 p-3 border border-gray-200 rounded text-sm text-gray-600 bg-white">
        <Link to="/" className="hover:text-jardinerie-primary hover:underline">Accueil</Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <span className="hover:text-jardinerie-primary cursor-pointer">{product.category_name}</span>
        {product.subcategory_name && (
          <>
            <span className="mx-2 text-gray-400">&gt;</span>
            <span className="text-gray-900 font-medium">{product.subcategory_name}</span>
          </>
        )}
      </nav>

      {/* 2. BLOC HAUT : 2 COLONNES (Wireframe) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        
        {/* Colonne Gauche : Galerie */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3] relative flex items-center justify-center group">
            {/* Flèches de carrousel factices pour correspondre au wireframe */}
            {galleryImages.length > 1 && (
              <>
                <button className="absolute left-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity">
                  &larr;
                </button>
                <button className="absolute right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity">
                  &rarr;
                </button>
              </>
            )}
            <img 
              src={activeImage} 
              alt={product.product_name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-contain p-4"
            />
          </div>

          {/* Miniatures */}
          {galleryImages.length > 0 && (
            <div className="flex gap-4 justify-center">
              {galleryImages.map((imgUrl, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-24 h-24 rounded-lg overflow-hidden border-2 bg-white ${
                    activeImage === imgUrl ? 'border-jardinerie-primary' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne Droite : Infos & Achat */}
        <div className="flex flex-col">
          
          <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.product_name}
            </h1>
            <p className="text-sm text-gray-500 font-mono">
              Réf : {productRef}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col items-center justify-center min-h-[250px]">
             {/* Sélecteur Qté | Prix | Bouton */}
             <div className="text-3xl font-extrabold text-gray-900 mb-8">
              {Number(product.price_tax_incl).toFixed(2)} €
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              {/* Quantité */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button onClick={() => handleQtyChange(-1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity <= 1}>-</button>
                <span className="px-4 py-3 min-w-[3rem] text-center font-medium border-x border-gray-300">{quantity}</span>
                <button onClick={() => handleQtyChange(1)} className="px-4 py-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled={quantity >= product.stock_quantity}>+</button>
              </div>

              {/* Bouton Panier */}
              <button 
                className={`flex-1 min-w-[200px] py-3.5 rounded-md font-bold text-lg transition-colors ${
                  product.stock_quantity > 0 
                    ? 'bg-jardinerie-primary text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={product.stock_quantity <= 0}
              >
                {product.stock_quantity > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. MODULE BOTANIQUE PLEINE LARGEUR (Wireframe) */}
      <section className="border border-gray-200 rounded-lg p-8 mb-12 bg-white text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Module Botanique</h2>
        
        <div className="flex justify-center gap-8 mb-6 text-gray-700">
          {product.sun_exposure && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Exposition</span>
              <span className="font-medium">☀️ {translateLabel(product.sun_exposure)}</span>
            </div>
          )}
          {product.water_requirement && (
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 uppercase tracking-wide mb-1">Arrosage</span>
              <span className="font-medium">💧 {translateLabel(product.water_requirement)}</span>
            </div>
          )}
        </div>

        {showFullBotanical && (
          <div className="max-w-3xl mx-auto text-left text-gray-600 mb-6 border-t border-gray-100 pt-6 animate-fade-in">
            <p className="mb-4"><strong>Description détaillée :</strong> {product.description}</p>
            {product.latin_name && <p><strong>Nom Latin :</strong> <i className="font-serif">{product.latin_name}</i></p>}
          </div>
        )}

        <button 
          onClick={() => setShowFullBotanical(!showFullBotanical)}
          className="border border-gray-300 rounded-full px-8 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {showFullBotanical ? 'Réduire' : 'Voir + d\'infos'}
        </button>
      </section>

      {/* 4. CROSS-SELLING (Wireframe) */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Produits qui pourraient vous intéresser</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Skeleton placeholders pour respecter le wireframe en attendant la requête */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col">
              <div className="bg-gray-100 w-full aspect-square rounded-md mb-4 flex items-center justify-center text-gray-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
              <div className="mt-auto flex justify-between items-end">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </article>
  );
}