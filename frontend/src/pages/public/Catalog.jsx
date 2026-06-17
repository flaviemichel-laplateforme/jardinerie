import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

export default function Catalog() {
  const location = useLocation();
  
  // Destructuration de notre hook personnalisé ultra-propre
  const { data: products, loading, error, request } = useApi();

  useEffect(() => {
    // 1. Lecture du mot-clé tapé dans la barre de recherche du Header
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    
    // 2. Contrôleur d'annulation pour éviter les fuites de mémoire (Memory Leaks)
    const controller = new AbortController();
    
    // 3. Appel asynchrone à votre API PHP
    const fetchProducts = async () => {
      // Ajustez le port (8000) si votre serveur PHP tourne sur un autre port
      const url = `http://localhost:8000/api/products?search=${encodeURIComponent(searchQuery)}`;
      await request(url, { signal: controller.signal });
    };

    fetchProducts();

    // 4. Nettoyage : annule la requête si l'utilisateur quitte la page avant la réponse du serveur
    return () => controller.abort();
    
  }, [location.search, request]);

  // --- RENDUS CONDITIONNELS ---

  // État 1 : Chargement en cours
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-jardinerie-primary"></div>
      </div>
    );
  }

  // État 2 : Erreur serveur (Le toast s'affichera en plus grâce à useApi)
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700 shadow-sm">
          <p className="mb-1 text-sm font-bold uppercase tracking-wider">Erreur de connexion</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // --- RENDU PRINCIPAL (Succès) ---

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
        Nos Végétaux & Produits
      </h1>

      {/* État 3 : La recherche n'a rien donné */}
      {!products || products.length === 0 ? (
        <p className="text-jardinerie-text opacity-70">
          Aucun produit ne correspond à votre recherche.
        </p>
      ) : (
        /* État 4 : Affichage de la grille de produits */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className=" overflow-hidden rounded-2xl border border-jardinerie-primary/10 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              
              {/* En-tête : Image et Badge de catégorie */}
              <div className="relative h-48 bg-jardinerie-bg/30">
                <img 
                  src={product.main_image_url || 'https://via.placeholder.com/300?text=Image+non+disponible'} 
                  alt={product.product_name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold uppercase text-jardinerie-primary backdrop-blur-sm">
                  {product.category_name}
                </span>
              </div>
              
              {/* Corps : Informations du produit */}
              <div className="flex h-40 flex-col justify-between p-5">
                <div>
                  <h2 
                    className="truncate text-base font-bold uppercase text-jardinerie-text" 
                    title={product.product_name}
                  >
                    {product.product_name}
                  </h2>
                  <p className="mt-1 text-xs italic text-jardinerie-text/60">
                    {product.department_name} &gt; {product.subcategory_name}
                  </p>
                </div>
                
                {/* Pied de carte : Prix et Stock */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-black text-jardinerie-primary">
                    {product.price_tax_incl} €
                  </span>
                  <span 
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      product.stock_quantity > 0 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {product.stock_quantity > 0 ? `Stock : ${product.stock_quantity}` : 'Épuisé'}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}