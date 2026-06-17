import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  // Déstructuration sécurisée avec des valeurs par défaut pour éviter les crashs
  // si certaines données ne sont pas encore gérées par l'API PHP.
  const {
    id,
    product_name,
    subcategory_name, // Joue le rôle du "Nom commun"
    price_tax_incl,
    main_image_url,
    stock_quantity = 0,
    // Simulations des futures données de votre table `plants`
    sun_exposure = 'sun', 
    packaging_options = 2 
  } = product;

  const inStock = stock_quantity > 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-jardinerie-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      
      {/* ========================================= */}
      {/* ZONE 1 : L'IMAGE ET LES ÉLÉMENTS ABSOLUS  */}
      {/* ========================================= */}
      <div className="relative h-[240px] w-full overflow-hidden bg-white/50">
        <img 
          src={main_image_url || 'https://via.placeholder.com/400x400?text=Image+non+disponible'} 
          alt={product_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Icône d'exposition (Haut Droite) */}
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {sun_exposure === 'sun' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" fill="#F4A261"/>
              <path d="M12 2V4M12 20V22M4 12H2M22 12H20M4.92893 4.92893L6.34315 6.34315M17.6569 17.6569L19.0711 19.0711M4.92893 19.0711L6.34315 17.6569M17.6569 6.34315L19.0711 4.92893" stroke="#F4A261" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* Badge de Stock (Bas Gauche) */}
        <div className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
          inStock ? 'bg-[#7DCEB2]' : 'bg-[#E63946]'
        }`}>
          {inStock ? 'En stock' : 'Épuisé'}
        </div>
      </div>

      {/* ========================================= */}
      {/* ZONE 2 : LES INFORMATIONS TEXTUELLES      */}
      {/* ========================================= */}
      <div className="flex flex-1 flex-col justify-between p-5">
        
        {/* Titres et description */}
        <div>
          <h2 className="line-clamp-2 text-lg font-bold leading-tight text-[#2B3A67]">
            {product_name}
          </h2>
          <p className="mt-1 text-sm font-medium text-[#2B3A67]/70">
            {subcategory_name}
          </p>
          <p className="mt-2 text-xs text-[#2B3A67]/50">
            {packaging_options} conditionnement{packaging_options > 1 ? 's' : ''} possible{packaging_options > 1 ? 's' : ''}
          </p>
        </div>

        {/* Prix et Bouton */}
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#2B3A67]/60">
              À partir de
            </p>
            <p className="text-2xl font-black text-[#2B3A67]">
              {/* Remplacement du point par une virgule pour l'affichage français */}
              {parseFloat(price_tax_incl).toFixed(2).replace('.', ',')}€
            </p>
          </div>

          {/* Bouton d'action (Lien vers la page détail) */}
          <Link 
            to={`/vegetaux/${id}`}
            className="self-start rounded-full border border-[#2B3A67]/30 bg-transparent px-8 py-2 text-xs font-bold text-[#2B3A67] transition-all hover:border-[#2B3A67] hover:bg-[#2B3A67] hover:text-white"
          >
            Voir le détail
          </Link>
        </div>
        
      </div>
    </div>
  );
}