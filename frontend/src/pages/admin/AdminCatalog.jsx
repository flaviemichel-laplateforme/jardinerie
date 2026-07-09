import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../../components/ui/Spinner';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

import AdminCatalogFilters from '../../components/admin/AdminCatalogFilters';
import AdminCatalogTable from '../../components/admin/AdminCatalogTable';

export default function AdminCatalog() {
  // --- 1. HOOKS D'API ET LECTURE DE L'URL ---
  const { data, loading, request, setData } = useApi();
  const { loading: deleteLoading, request: deleteRequest } = useApi();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const products = data?.products ?? [];
  const filterParam = searchParams.get('filter'); 

  // --- 2. ÉTATS LOCAUX DES FILTRES ---
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('tous'); 
  const [sortBy, setSortBy] = useState('alpha-asc');
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const [selectedSubcategory, setSelectedSubcategory] = useState('tous');
  const [deletingId, setDeletingId] = useState(null);

  // --- 3. SYNCHRONISATION (Dashboard -> Catalogue) ---
  useEffect(() => {
    if (filterParam === 'critical') {
      setFilterActive('critical');
    }
  }, [filterParam]);

  // --- 4. CHARGEMENT INITIAL DES DONNÉES ---
  useEffect(() => {
    const controller = new AbortController();
    request(
      adminService.buildProductsUrl(),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request]);

  // --- 5. NETTOYAGE DES PARAMÈTRES D'URL ---
  const clearUrlFilter = () => {
    if (searchParams.has('filter')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('filter');
      setSearchParams(newParams);
    }
  };

  const handleDelete = async () => {
    const result = await deleteRequest(
      adminService.buildProductUrl(deletingId),
      buildRequestOptions({ method: 'DELETE' }),
      false
    );

    if (result.success) {
      setData(prev => ({
        ...prev,
        products: prev.products.map(p =>
          p.id === deletingId ? { ...p, is_active: '0' } : p
        ),
      }));
      toast.success('Produit désactivé avec succès.');
    } else {
      toast.error('Une erreur est survenue.');
    }
    setDeletingId(null);
  };

  // --- 6. LOGIQUE D'EXTRACTION DES LISTES ---
  const categoriesList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const names = products.map(p => p.category_name).filter(Boolean);
    return [...new Set(names)].sort();
  }, [products]);

  const subcategoriesList = useMemo(() => {
    if (!products || products.length === 0) return [];
    let relevantProducts = products;
    if (selectedCategory !== 'tous') {
      relevantProducts = products.filter(p => p.category_name === selectedCategory);
    }
    const names = relevantProducts.map(p => p.subcategory_name).filter(Boolean);
    return [...new Set(names)].sort();
  }, [products, selectedCategory]);

  // --- 7. MOTEUR DE FILTRAGE ET TRI ---
  const filteredAndSorted = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'tous' ? true : p.category_name === selectedCategory;
      const matchSubcategory = selectedSubcategory === 'tous' ? true : p.subcategory_name === selectedSubcategory;

      let matchStatusAndStock = true;
      if (filterActive === 'actif') matchStatusAndStock = parseInt(p.is_active) === 1;
      if (filterActive === 'inactif') matchStatusAndStock = parseInt(p.is_active) === 0;
      if (filterActive === 'critical') matchStatusAndStock = parseInt(p.stock_quantity) <= 5;

      return matchSearch && matchCategory && matchSubcategory && matchStatusAndStock;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc': return a.name.localeCompare(b.name);
        case 'alpha-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return parseFloat(a.price_tax_incl) - parseFloat(b.price_tax_incl);
        case 'price-desc': return parseFloat(b.price_tax_incl) - parseFloat(a.price_tax_incl); // Correction : a.price_tax_incl
        case 'stock-asc': return parseInt(a.stock_quantity) - parseInt(b.stock_quantity);
        case 'stock-desc': return parseInt(b.stock_quantity) - parseInt(a.stock_quantity);
        default: return 0;
      }
    });

    return result;
  }, [products, search, filterActive, sortBy, selectedCategory, selectedSubcategory]);

  // Compteur de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (filterActive !== 'tous') count++;
    if (selectedCategory !== 'tous') count++;
    if (selectedSubcategory !== 'tous') count++;
    return count;
  }, [search, filterActive, selectedCategory, selectedSubcategory]);

  // --- 8. RENDU ---
  if (loading) return <Spinner message="Chargement du catalogue..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-jardinerie-text">Gestion du catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredAndSorted.length} produit{filteredAndSorted.length > 1 ? 's' : ''} filtré{filteredAndSorted.length > 1 ? 's' : ''} sur {products.length}
          </p>
        </div>
        <Link
          to="/admin/catalogue/nouveau"
          className="self-start rounded-full bg-jardinerie-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors shadow-sm"
        >
          + Nouveau produit
        </Link>
      </div>

      {/* Barre de sélection */}
      <AdminCatalogFilters 
        search={search} 
        setSearch={setSearch}
        sortBy={sortBy} 
        setSortBy={setSortBy}
        filterActive={filterActive} 
        setFilterActive={(val) => { 
          setFilterActive(val); 
          if (val !== 'critical') clearUrlFilter(); 
        }}
        categories={categoriesList} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={(val) => { 
          setSelectedCategory(val); 
          setSelectedSubcategory('tous'); 
        }}
        subcategories={subcategoriesList} 
        selectedSubcategory={selectedSubcategory} 
        setSelectedSubcategory={setSelectedSubcategory} 
      />

      {/* 🚀 ZONE DES FILTRES ACTIFS (STYLE AMAZON) */}
      {activeFiltersCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-gray-500 mr-2">Filtres actifs :</span>

          {search && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full text-sm shadow-sm">
              Recherche : <span className="font-bold">{search}</span>
              <button onClick={() => setSearch('')} className="hover:bg-gray-100 rounded-full p-0.5 ml-1 transition-colors focus:outline-none">
                <X className="w-4 h-4 text-gray-500 hover:text-gray-900" />
              </button>
            </span>
          )}

          {filterActive !== 'tous' && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm shadow-sm border ${
              filterActive === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-300 text-gray-700'
            }`}>
              {filterActive === 'actif' && <span>Statut : <span className="font-bold">Actifs</span></span>}
              {filterActive === 'inactif' && <span>Statut : <span className="font-bold">Inactifs</span></span>}
              {filterActive === 'critical' && <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> <span className="font-bold">Stock Critique (≤ 5)</span></span>}
              <button 
                onClick={() => { setFilterActive('tous'); clearUrlFilter(); }} 
                className="hover:bg-gray-100 rounded-full p-0.5 ml-1 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-900" />
              </button>
            </span>
          )}

          {selectedCategory !== 'tous' && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full text-sm shadow-sm">
              Catégorie : <span className="font-bold">{selectedCategory}</span>
              <button onClick={() => { setSelectedCategory('tous'); setSelectedSubcategory('tous'); }} className="hover:bg-gray-100 rounded-full p-0.5 ml-1 transition-colors focus:outline-none">
                <X className="w-4 h-4 text-gray-500 hover:text-gray-900" />
              </button>
            </span>
          )}

          {selectedSubcategory !== 'tous' && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full text-sm shadow-sm">
              Sous-catégorie : <span className="font-bold">{selectedSubcategory}</span>
              <button onClick={() => setSelectedSubcategory('tous')} className="hover:bg-gray-100 rounded-full p-0.5 ml-1 transition-colors focus:outline-none">
                <X className="w-4 h-4 text-gray-500 hover:text-gray-900" />
              </button>
            </span>
          )}

          {activeFiltersCount > 1 && (
            <button 
              onClick={() => {
                setSearch('');
                setFilterActive('tous');
                setSelectedCategory('tous');
                setSelectedSubcategory('tous');
                clearUrlFilter();
              }} 
              className="text-sm text-jardinerie-primary hover:text-green-700 font-bold ml-2 underline underline-offset-2 transition-colors focus:outline-none"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}

      {/* Tableau d'affichage */}
      <AdminCatalogTable 
        products={filteredAndSorted} 
        onDeactivateClick={setDeletingId} 
      />

      {/* Modale */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Désactiver ce produit ?"
        message="Le produit sera masqué du catalogue public. Vos commandes existantes ne seront pas affectées."
        confirmLabel="Oui, désactiver"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}