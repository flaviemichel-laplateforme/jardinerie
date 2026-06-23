import ProductCard from './ProductCard';

export default function ProductRow({ title, products }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Titre de la section (ex: Sélection du moment !) */}
      <h2 className="mb-6 text-2xl font-extrabold text-jardinerie-text">
        {title}
      </h2>

      {/* LE SECRET DU CARROUSEL MOBILE HYBRIDE :
        - Sur mobile : 'flex overflow-x-auto snap-x' crée un slider horizontal
        - Sur desktop (md:) : 'md:grid md:grid-cols-3' casse le slider pour en faire une grille stricte
        - La scrollbar est cachée pour un look plus "App" avec une classe custom ou via les utilitaires standards.
      */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
        {products.map((product) => (
          // Sur mobile, chaque carte prend 85% de l'écran (min-w-[85%]) pour qu'on devine la suivante.
          // Sur desktop (md:), la largeur forcée est annulée (md:min-w-0) car la grille s'en occupe.
          <div key={product.id} className="min-w-[85%] snap-start md:min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};
