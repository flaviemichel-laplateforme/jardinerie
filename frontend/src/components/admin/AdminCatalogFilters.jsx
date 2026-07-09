import { AlertTriangle } from 'lucide-react';

export default function AdminCatalogFilters({ 
  search, setSearch, 
  sortBy, setSortBy, 
  filterActive, setFilterActive,
  categories = [], selectedCategory, setSelectedCategory,
  subcategories = [], selectedSubcategory, setSelectedSubcategory 
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Recherche */}
        <div className="lg:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-jardinerie-primary focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Catégorie */}
        <select
          value={selectedCategory}
          onChange={e => { setSelectedCategory(e.target.value); setSelectedSubcategory('tous'); }}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-jardinerie-primary outline-none"
        >
          <option value="tous">Toutes les catégories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        {/* Sous-Catégorie */}
        <select
          value={selectedSubcategory}
          onChange={e => setSelectedSubcategory(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-jardinerie-primary outline-none"
        >
          <option value="tous">Toutes les sous-catégories</option>
          {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>
      </div>

      {/* Ligne secondaire */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
        
        {/* Tris */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Trier par:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 outline-none hover:border-gray-300"
          >
            <option value="alpha-asc">Nom (A-Z)</option>
            <option value="alpha-desc">Nom (Z-A)</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="price-asc">Prix croissant</option>
            <option value="stock-asc">Stock bas</option>
            <option value="stock-desc">Stock haut</option>
          </select>
        </div>

        {/* Onglets de Statuts / Stocks */}
        <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1">
          {[
            { id: 'tous', label: 'Tous' },
            { id: 'actif', label: 'Actifs' },
            { id: 'inactif', label: 'Inactifs' },
            { id: 'critical', label: 'Stock Critique', isAlert: true }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setFilterActive(status.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterActive === status.id 
                ? (status.isAlert ? 'bg-red-50 text-red-700 shadow-sm border border-red-100' : 'bg-white text-jardinerie-primary shadow-sm border border-gray-200') 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {status.isAlert && <AlertTriangle className={`w-3.5 h-3.5 ${filterActive === status.id ? 'text-red-600' : 'text-gray-400'}`} />}
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}