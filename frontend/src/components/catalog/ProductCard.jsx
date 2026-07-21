import { Link } from 'react-router-dom';
import { Sun, CloudSun, Cloud } from 'lucide-react';
import StockBadge from '../ui/StockBadge';
// IMPORT 1 : On importe l'outil de résolution d'URL (Vérifiez bien le chemin de l'import selon votre dossier)
import { resolveAssetUrl } from '../../services/apiClient'; 
// IMPORT 2 : L'image par défaut
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';

export default function ProductCard({ product }) {
  // Déstructuration sécurisée avec des valeurs par défaut
  const {
    id,
    product_name,
    subcategory_name, 
    price_tax_incl,
    main_image_url,
    stock_quantity = 0,
    sun_exposure,
    packaging_options = 2
  } = product;

  // 3. MAGIE : On construit la vraie URL de l'image (PHP) ou on garde le placeholder
  const finalImageUrl = main_image_url ? resolveAssetUrl(main_image_url) : placeholderImg;

  const EXPOSURE_ICONS = {
    'Sun': { Icon: Sun, color: '#F4A261' },
    'Partial Shade': { Icon: CloudSun, color: '#A98A7D' },
    'Shade': { Icon: Cloud, color: '#505F40' },
  };
  const exposureIcon = EXPOSURE_ICONS[sun_exposure];

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-jardinerie-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      
      {/* ========================================= */}
      {/* ZONE 1 : L'IMAGE ET LES ÉLÉMENTS ABSOLUS  */}
      {/* ========================================= */}
      <div className="relative h-[240px] w-full overflow-hidden bg-white/50">
        <img 
          loading="lazy"
          // 4. On utilise notre variable calculée qui contient le bon chemin du serveur
          src={finalImageUrl} 
          
          alt={product_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          
          // SÉCURITÉ : Si l'URL de PHP est morte (404), on remet le placeholder
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = placeholderImg;
          }}
        />

        {/* Icône d'exposition (Haut Droite) */}
        {exposureIcon && (
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
            <exposureIcon.Icon size={18} color={exposureIcon.color} />
          </div>
        )}

        {/* Badge de Stock Dynamique (Bas Gauche) */}
        <div className="absolute bottom-3 left-3 shadow-sm">
          <StockBadge quantity={stock_quantity} />
        </div>
      </div>

      {/* ========================================= */}
      {/* ZONE 2 : LES INFORMATIONS TEXTUELLES      */}
      {/* ========================================= */}
      <div className="flex flex-1 flex-col justify-between p-5">
        
        {/* Titres et description */}
        <div>
          <h2 className="line-clamp-2 text-lg font-bold leading-tight text-jardinerie-text">
            {product_name}
          </h2>
          <p className="mt-1 text-sm font-medium text-jardinerie-text/70">
            {subcategory_name}
          </p>
          <p className="mt-2 text-xs text-jardinerie-text/50">
            {packaging_options} conditionnement{packaging_options > 1 ? 's' : ''} possible{packaging_options > 1 ? 's' : ''}
          </p>
        </div>

        {/* Prix et Bouton */}
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-jardinerie-text/60">
              À partir de
            </p>
            <p className="text-2xl font-black text-jardinerie-text">
              {parseFloat(price_tax_incl).toFixed(2).replace('.', ',')}€
            </p>
          </div>

          {/* Bouton d'action (Lien vers la page détail) */}
          <Link 
            to={`/produit/${id}`}
            className="self-start rounded-full border border-jardinerie-primary bg-transparent px-8 py-2 text-xs font-bold text-jardinerie-text transition-all hover:border-white hover:bg-jardinerie-primary hover:text-jardinerie-light"
          >
            Voir le détail
          </Link>
        </div>
        
      </div>
    </div>
  );
}