import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Galerie photo d'une fiche produit : un carrousel qui défile au doigt (scroll-snap natif), pleine largeur
 * sur mobile avec des points de position, et des miniatures cliquables à partir de md.
 * Un seul jeu d'images pour tous les écrans (les images ne sont pas chargées en double).
 *
 * À monter avec `key={product.id}` : changer de produit repart de la première photo.
 *
 * @param {{ url: string, alt: string }[]} images - Les photos (au moins une)
 * @param {string} label - Nom du produit, utilisé pour nommer la région
 * @param {string} fallbackUrl - Image affichée si une photo ne se charge pas
 * @param {React.ReactNode} [overlay] - Contenu posé par-dessus la galerie (ex. bouton retour mobile)
 * @param {string} [className] - Classes ajoutées au conteneur (ex. position collante)
 */
export default function ProductGallery({ images, label, fallbackUrl, overlay, className = '' }) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const hasSeveral = images.length > 1;

  const arrowClass =
    'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-jardinerie-text shadow-md transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-40 md:flex md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:aria-disabled:group-hover:opacity-40';

  // La photo visible = position de défilement / largeur d'une diapositive
  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    setActive(Math.round(scroller.scrollLeft / scroller.clientWidth));
  };

  const goTo = (index) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: index * scroller.clientWidth, behavior: 'smooth' });
  };

  return (
    <div role="region" aria-roledescription="carrousel" aria-label={`Photos de ${label}`} className={`flex flex-col md:gap-4 ${className}`}>
      {/* md et plus : pas de bordure, une tuile blanche aux angles arrondis qui se fond dans le fond de la page.
          `group` : les flèches n'apparaissent qu'au survol (ou au focus clavier). */}
      <div className="group relative bg-white md:overflow-hidden md:rounded-2xl">
        {overlay}

        {/* md et plus : flèches précédent / suivant (à la souris, on ne peut pas faire glisser le carrousel).
            aria-disabled (et non retirées) : le focus clavier n'est pas perdu au bout du carrousel. */}
        {hasSeveral && (
          <>
            <button
              type="button"
              onClick={() => active > 0 && goTo(active - 1)}
              aria-label="Photo précédente"
              aria-disabled={active === 0}
              className={`${arrowClass} left-3`}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => active < images.length - 1 && goTo(active + 1)}
              aria-label="Photo suivante"
              aria-disabled={active === images.length - 1}
              className={`${arrowClass} right-3`}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}

        {/* overflow-x-auto + snap : on glisse d'une photo à l'autre, chacune s'aimante. Barre de défilement masquée. */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto md:h-[min(70vh,720px)] lg:h-[min(calc(100vh_-_var(--header-h,170px)_-_9rem),720px)] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div
              key={image.url}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${index + 1} sur ${images.length}`}
              // Carré sur mobile ; à partir de md, toute la hauteur du carrousel (plafonnée à 70 % de l'écran) ;
              // photo entière (object-contain), jamais rognée
              className="aspect-square w-full shrink-0 snap-center md:aspect-auto md:h-full"
            >
              <img
                src={image.url}
                alt={image.alt}
                // La première photo est celle de l'écran initial : prioritaire. Les autres attendent d'être utiles.
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : undefined}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackUrl;
                }}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {hasSeveral && (
        <>
          {/* Annonce la photo affichée aux lecteurs d'écran quand on change de diapositive */}
          <p className="sr-only" aria-live="polite">
            Photo {active + 1} sur {images.length}
          </p>

          {/* Mobile : points de position (un seul slide visible à la fois). Le bouton est plus grand que le point. */}
          <div className="flex justify-center md:hidden">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Voir la photo ${index + 1} sur ${images.length}`}
                aria-current={index === active ? 'true' : undefined}
                className="rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary"
              >
                <span
                  className={`block h-2.5 w-2.5 rounded-full transition-colors ${
                    index === active ? 'bg-jardinerie-primary' : 'bg-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* md et plus : miniatures */}
          <div className="hidden justify-center gap-3 md:flex">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Voir la photo ${index + 1} sur ${images.length}`}
                aria-current={index === active ? 'true' : undefined}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2 ${
                  index === active
                    ? 'border-jardinerie-primary ring-2 ring-jardinerie-primary/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
