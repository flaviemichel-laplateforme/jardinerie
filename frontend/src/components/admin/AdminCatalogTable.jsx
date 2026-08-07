import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';

const stockBadge = (qty) => {
  const q = parseInt(qty);
  if (q === 0)  return 'bg-red-100 text-red-700';
  if (q <= 5)   return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
};

export default function AdminCatalogTable({ products, onDeactivateClick }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-jardinerie-bg border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Produit</th>
            
            {/* CORRECTION DU TITRE ICI */}
            <th className="text-left px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide hidden md:table-cell">
              Sous-catégorie
            </th>
            
            <th className="text-right px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Prix TTC</th>
            <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Stock</th>
            <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Statut</th>
            <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-400 italic">Aucun produit trouvé.</td>
            </tr>
          ) : (
            products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 flex items-center gap-3">
                  <img 
                    src={product.main_image_url ? resolveAssetUrl(product.main_image_url) : placeholderImg} 
                    alt={product.name}
                    className="h-10 w-10 rounded-md object-cover border border-gray-200 shrink-0"
                  />
                  <div>
                    <p className="font-medium text-jardinerie-text">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">#{product.id}</p>
                  </div>
                </td>
                
                {/* La donnée affichée est bien la sous-catégorie */}
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {product.subcategory_name}
                </td>
                
                <td className="px-4 py-3 text-right font-bold text-jardinerie-primary">
                  {parseFloat(product.price_tax_incl).toFixed(2).replace('.', ',')} €
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${stockBadge(product.stock_quantity)}`}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    parseInt(product.is_active) === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {parseInt(product.is_active) === 1 ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/admin/catalogue/${product.id}/modifier`}
                      className="rounded-lg bg-jardinerie-bg px-3 py-1.5 text-xs font-medium text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white transition-colors"
                    >
                      Modifier
                    </Link>
                    {parseInt(product.is_active) === 1 && (
                      <button
                        type="button"
                        onClick={() => onDeactivateClick(product.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Désactiver
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}