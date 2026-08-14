import ProductCard from './ProductCard';

export default function ProductRow({ title, products }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Titre de la section (ex: Sélection du moment !) */}
      <h2 className="mb-6 text-2xl font-extrabold text-jardinerie-text">
        {title}
      </h2>

      {/* Même grille responsive que les pages Catalogue/Végétaux/Jardinage :
        des cartes de taille cohérente (240px minimum), qui se répartissent
        automatiquement en colonnes selon l'espace disponible. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
