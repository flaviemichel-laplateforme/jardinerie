import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../../components/ui/Spinner';
import ConfirmModal from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

import AdminCatalogFilters from '../../components/admin/AdminCatalogFilters';
import AdminCatalogTable from '../../components/admin/AdminCatalogTable';

export default function AdminCatalog() {
  const { data, loading, request, setData } = useApi();
  const { loading: deleteLoading, request: deleteRequest } = useApi();

  const products = data?.products ?? [];
  const [search,              setSearch]              = useState('');
  const [filterActive,        setFilterActive]        = useState('tous');
  const [sortBy,              setSortBy]              = useState('alpha-asc');
  const [selectedCategory,    setSelectedCategory]    = useState('tous'); // NOUVEAU
  const [selectedSubcategory, setSelectedSubcategory] = useState('tous');
  const [deletingId,          setDeletingId]          = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    request(
      adminService.buildProductsUrl(),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request]);

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

  // --- LOGIQUE D'EXTRACTION DES LISTES POUR LES MENUS DÉROULANTS ---

  // 1. Liste des catégories uniques
  const categoriesList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const names = products.map(p => p.category_name).filter(Boolean);
    return [...new Set(names)].sort(); // On trie par ordre alphabétique
  }, [products]);

  // 2. Liste des sous-catégories (Filtrée dynamiquement si une catégorie est sélectionnée !)
  const subcategoriesList = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Si une catégorie est choisie, on ne liste que SES sous-catégories
    let relevantProducts = products;
    if (selectedCategory !== 'all') {
      relevantProducts = products.filter(p => p.category_name === selectedCategory);
    }
    
    const names = relevantProducts.map(p => p.subcategory_name).filter(Boolean);
    return [...new Set(names)].sort();
  }, [products, selectedCategory]);


  // --- LOGIQUE DE FILTRAGE DU TABLEAU ---

  const filteredAndSorted = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchActive =
        filterActive === 'tous'     ? true :
        filterActive === 'actif'  ? parseInt(p.is_active) === 1 :
                                     parseInt(p.is_active) === 0;
      
      const matchCategory = 
        selectedCategory === 'tous' ? true : p.category_name === selectedCategory;
      const matchSubcategory = 
        selectedSubcategory === 'tous' ? true : p.subcategory_name === selectedSubcategory;

      return matchSearch && matchActive && matchCategory && matchSubcategory;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc':
          return a.name.localeCompare(b.name);
        case 'alpha-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return parseFloat(a.price_tax_incl) - parseFloat(b.price_tax_incl);
        case 'price-desc':
          return parseFloat(b.price_tax_incl) - parseFloat(a.price_tax_incl);
        case 'stock-asc':
          return parseInt(a.stock_quantity) - parseInt(b.stock_quantity);
        case 'stock-desc':
          return parseInt(b.stock_quantity) - parseInt(a.stock_quantity);
        default:
          return 0;
      }
    });

    return result;
  }, [products, search, filterActive, sortBy, selectedCategory, selectedSubcategory]);

  if (loading) return <Spinner message="Chargement du catalogue..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-jardinerie-text">Gestion du catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link
          to="/admin/catalogue/nouveau"
          className="self-start rounded-full bg-jardinerie-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
        >
          + Nouveau produit
        </Link>
      </div>

      <AdminCatalogFilters 
        search={search}                             setSearch={setSearch}
        sortBy={sortBy}                             setSortBy={setSortBy}
        filterActive={filterActive}                 setFilterActive={setFilterActive}
        categories={categoriesList}                 selectedCategory={selectedCategory}       setSelectedCategory={setSelectedCategory}
        subcategories={subcategoriesList}           selectedSubcategory={selectedSubcategory} setSelectedSubcategory={setSelectedSubcategory} 
      />

      <AdminCatalogTable 
        products={filteredAndSorted} 
        onDeactivateClick={setDeletingId} 
      />

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