import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../../../hooks/useDebounce';
import { useApi } from '../../../hooks/useApi';
import loupeIcon from '../../../assets/img/icone-loupe.svg';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  
  // N'oubliez pas les parenthèses () pour exécuter le hook !
  const { data: suggestions, loading, request } = useApi();

  // Anti-rebond (debounce) de 300ms pour attendre que l'utilisateur arrête de taper
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Déclenche l'appel API uniquement quand le terme stabilisé contient au moins 2 caractères
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      const fetchSuggestions = async () => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        await request(`${baseUrl}/api/products?search=${encodeURIComponent(debouncedSearchTerm)}&limit=5`);
        setIsOpen(true);
      };
      fetchSuggestions();
    } else {
      setIsOpen(false);
    }
  }, [debouncedSearchTerm, request]);

  // Ferme la liste des suggestions si on clique en dehors du composant
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction déclenchée lors de la validation (clic sur la loupe ou touche Entrée)
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      setIsOpen(false);
      navigate(`/vegetaux?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  // Clic sur une suggestion de la liste
  const handleSuggestionClick = (productId) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate(`/produit/${productId}`); 
  };

  return (
    <div ref={wrapperRef} className="relative flex-grow max-w-xl mx-12">
      <form onSubmit={handleSearch}>
        <div className="flex items-center border border-jardinerie-primary rounded-lg bg-[#EAECE1] overflow-hidden h-12 shadow-sm focus-within:ring-2 focus-within:ring-jardinerie-primary/50 transition-all">
          
          {/* Champ de saisie */}
          <input 
            type="text" 
            placeholder="Rechercher une plante, un outil..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (suggestions?.length > 0) setIsOpen(true);
            }}
            onFocus={() => { if (suggestions?.length > 0) setIsOpen(true); }}
            className="w-full py-2 px-6 bg-transparent focus:outline-none text-jardinerie-text placeholder-jardinerie-text/50"
          />
          
          {/* Ligne de séparation verticale */}
          <div className="h-8 border-l border-jardinerie-primary"></div>
          
          {/* Bouton de soumission avec indicateur de chargement intégré */}
          <button 
            type="submit" 
            className="px-4 hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer min-w-[3rem]"
            aria-label="Lancer la recherche"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-jardinerie-primary/30 border-t-jardinerie-primary"></div>
            ) : (
              <img src={loupeIcon} alt="" className="h-6 w-6 object-contain" aria-hidden="true" />
            )}
          </button>
          
        </div>
      </form>

      {/* PANNEAU FLOTTANT DES SUGGESTIONS */}
      {isOpen && suggestions && (
        <div className="absolute left-0 mt-2 w-full overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50 transition-all">
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {suggestions.length > 0 ? (
              suggestions.map((product) => (
                <li
                  key={product.id}
                  className="flex cursor-pointer items-center gap-4 p-3 transition-colors hover:bg-[#EAECE1]/50"
                  onClick={() => handleSuggestionClick(product.id)}
                >
                  <img
                    src={product.main_image_url || '/placeholder.png'}
                    alt={product.product_name}
                    className="h-10 w-10 rounded-md object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{product.product_name}</h4>
                    <p className="text-xs text-gray-500 truncate">{product.category_name}</p>
                  </div>
                  <div className="text-sm font-bold text-jardinerie-primary whitespace-nowrap">
                    {product.price_tax_incl} €
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-sm text-gray-500 italic">
                Aucun résultat ne correspond à votre recherche
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}