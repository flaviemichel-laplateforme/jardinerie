import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../../../hooks/useDebounce';
import { useApi } from '../../../hooks/useApi';
import loupeIcon from '../../../assets/img/icone-loupe.svg';
import placeholderImg from '../../../assets/img/placeholder-vegetaux.png';
import { productService } from '../../../services/productService';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const { data: suggestions, loading, request } = useApi();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.trim().length < 2) {
      return;
    }

    const fetchSuggestions = async () => {
      const url = productService.buildCatalogUrl({ search: debouncedSearchTerm, limit: 5 });
      await request(url);
      setIsOpen(true);
    };
    fetchSuggestions();
  }, [debouncedSearchTerm, request]);

  // Le panneau n'est visible que si isOpen ET que le terme est suffisamment long.
  const showSuggestions = isOpen && debouncedSearchTerm.trim().length >= 2;

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      setIsOpen(false);
      navigate(`/vegetaux?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleSuggestionClick = (productId) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate(`/produit/${productId}`); 
  };

  return (
    <div ref={wrapperRef} className="relative flex-grow max-w-xl mx-12">
      <form onSubmit={handleSearch}>
        <div className="flex items-center border border-jardinerie-primary rounded-lg bg-[#EAECE1] overflow-hidden h-12 shadow-sm focus-within:ring-2 focus-within:ring-jardinerie-primary/50 transition-all">
          
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
          
          <div className="h-8 border-l border-jardinerie-primary"></div>
          
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

      {showSuggestions && suggestions && (
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
                    src={product.main_image_url || placeholderImg}
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