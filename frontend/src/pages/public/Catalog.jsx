import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import Spinner from '../../components/ui/Spinner';
import ProductCard from '../../components/catalog/ProductCard';

export default function Catalog() {
  const location = useLocation();
  const { data: products, loading, error, request } = useApi();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      // On récupère l'URL de base depuis le fichier .env
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      
      // On construit l'URL finale
      const url = `${baseUrl}/api/products?search=${encodeURIComponent(searchQuery)}`;
      
      await request(url, { signal: controller.signal });
    };

    fetchProducts();

    return () => controller.abort();
  }, [location.search, request]);

  // --- RENDUS CONDITIONNELS ---

  if (loading) {
    return <Spinner message="Recherche des végétaux en cours..." />;
  }

  // Si une erreur survient, le Toast (géré par useApi) l'affichera déjà, 
  // mais on peut laisser un message discret sur la page.
  if (error) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-lg font-medium text-[#E63946]">Le catalogue est momentanément indisponible.</p>
        <p className="mt-2 text-sm text-jardinerie-text/70">Veuillez réessayer dans quelques instants.</p>
      </div>
    );
  }

  // --- RENDU PRINCIPAL ---

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      
      {/* En-tête de la page */}
      <div className="mb-10 flex items-center justify-between border-b border-jardinerie-primary/20 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-jardinerie-text">
          Nos Végétaux & Produits
        </h1>
        {products && (
          <span className="text-sm font-medium text-jardinerie-text/60">
            {products.length} résultat{products.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grille de résultats */}
      {!products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-jardinerie-primary opacity-50">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-lg font-medium text-jardinerie-text">Aucun végétal ne correspond à votre recherche.</p>
          <p className="text-sm text-jardinerie-text/70">Essayez d'autres mots-clés comme "Orchidée" ou "Basilic".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}