'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductRow({ title, products }) {
  const scrollerRef = useRef(null);
  const headingId = useId();

  // Un seul état pour tout ce qui dépend de la position de défilement :
  // flèches actives ou non, "pouce" de la barre de progression et valeur du curseur.
  const [scrollState, setScrollState] = useState({
    isScrollable: false,
    canScrollLeft: false,
    canScrollRight: false,
    thumbWidth: 100,
    thumbLeft: 0,
    progress: 0,
    cardStep: 1,
    maxIndex: 0,
    index: 0,
  });

  // Le "- 1" absorbe les arrondis de pixels des écrans à haute densité.
  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const { scrollLeft, clientWidth, scrollWidth } = scroller;
    const maxScroll = scrollWidth - clientWidth;
    const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;

    // Distance entre le début de deux cartes (largeur + espace) : c'est le "pas" du curseur.
    // Le curseur avance carte par carte, comme l'aimantation (snap) du carrousel.
    const first = scroller.firstElementChild;
    const second = first?.nextElementSibling;
    const cardStep = second ? second.offsetLeft - first.offsetLeft : clientWidth;
    const maxIndex = cardStep > 0 ? Math.ceil(maxScroll / cardStep) : 0;

    setScrollState({
      isScrollable: scrollWidth > clientWidth + 1,
      canScrollLeft: scrollLeft > 0,
      canScrollRight,
      // Largeur du pouce = part visible du contenu ; position = part déjà défilée.
      thumbWidth: (clientWidth / scrollWidth) * 100,
      thumbLeft: (scrollLeft / scrollWidth) * 100,
      progress: maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0,
      cardStep,
      maxIndex,
      // En fin de course, on force le dernier cran : le dernier défilement est
      // généralement plus court qu'un pas complet.
      index: canScrollRight ? Math.min(Math.round(scrollLeft / cardStep), maxIndex) : maxIndex,
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState, products]);

  // Une flèche fait défiler d'environ 80 % de la largeur visible : on garde
  // une carte de repère d'un clic à l'autre. Une flèche inactive ne fait rien.
  const scrollByPage = (direction, isEnabled) => {
    const scroller = scrollerRef.current;
    if (!scroller || !isEnabled) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: 'smooth' });
  };

  // Le curseur déplace le carrousel directement sur la carte choisie.
  // "instant" : avec un défilement animé, la valeur du curseur serait recalculée en cours de route
  // et le pouce sauterait pendant le glissement.
  const scrollToIndex = (index) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    scroller.scrollTo({ left: Math.min(index * scrollState.cardStep, maxScroll), behavior: 'instant' });
  };

  if (!products || products.length === 0) return null;

  const {
    isScrollable, canScrollLeft, canScrollRight, thumbWidth, thumbLeft, progress, maxIndex, index,
  } = scrollState;

  // aria-disabled (et non "disabled") : le bouton garde le focus clavier quand on atteint
  // le bout du carrousel, au lieu de renvoyer l'utilisateur en haut de la page.
  const arrowClass =
    'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-jardinerie-primary shadow-lg ring-1 ring-black/5 transition-all hover:bg-jardinerie-primary hover:text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-white aria-disabled:hover:text-jardinerie-primary md:flex';

  return (
    // aria-labelledby : les lecteurs d'écran annoncent la région par le titre de la rangée.
    <section className="mt-12" aria-labelledby={headingId}>
      {/* Titre de la section (ex: Sélection du moment !) */}
      <h2 id={headingId} className="mb-6 text-2xl font-extrabold text-jardinerie-text">
        {title}
      </h2>

      <div className="relative">
        {/* Les flèches n'ont de sens que si le contenu déborde réellement */}
        {isScrollable && (
          <button
            type="button"
            onClick={() => scrollByPage(-1, canScrollLeft)}
            aria-disabled={!canScrollLeft}
            aria-label={`${title} : produits précédents`}
            className={`${arrowClass} -left-4`}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Carrousel : une seule ligne qui défile horizontalement.
          - overflow-x-auto : le défilement (au doigt sur mobile, à la molette/flèches sur desktop)
          - snap-x snap-mandatory : chaque carte s'aimante au bord à l'arrêt du défilement
          - pt-2 pb-4 : laisse la place à l'ombre et au léger soulèvement des cartes au survol,
            que overflow-x-auto couperait sinon
          - masquage de la barre de défilement native : remplacée par notre barre de progression */}
        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            // Largeur fixe : les cartes gardent la même taille quel que soit l'écran, et sur mobile
            // on devine la carte suivante, ce qui invite à glisser.
            // shrink-0 empêche les cartes de s'écraser pour tenir dans la ligne.
            <div key={product.id} className="w-[240px] shrink-0 snap-start sm:w-[260px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {isScrollable && (
          <button
            type="button"
            onClick={() => scrollByPage(1, canScrollRight)}
            aria-disabled={!canScrollRight}
            aria-label={`${title} : produits suivants`}
            className={`${arrowClass} -right-4`}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Barre de progression cliquable.
        - L'<input type="range"> natif, invisible (opacity-0), couvre toute la barre : il apporte
          gratuitement le clic, le glissement, les flèches du clavier et l'annonce par les lecteurs d'écran.
        - La barre dessinée dessous (aria-hidden) n'est que l'habillage visuel : la piste représente tout
          le contenu, le pouce la partie visible.
        - h-6 : zone de clic/toucher confortable autour d'une barre fine de 4 px.
        - peer / peer-focus-visible : l'input étant invisible, c'est la barre qui affiche l'anneau de focus. */}
      {isScrollable && (
        <div className="relative mt-2 flex h-6 items-center">
          <input
            type="range"
            min={0}
            max={maxIndex}
            step={1}
            value={index}
            onChange={(e) => scrollToIndex(Number(e.target.value))}
            aria-label={`Position dans ${title}`}
            aria-valuetext={`${Math.round(progress)} % parcouru`}
            className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
          />
          <div
            aria-hidden="true"
            className="h-1 w-full rounded-full bg-jardinerie-primary/15 peer-focus-visible:ring-2 peer-focus-visible:ring-jardinerie-primary peer-focus-visible:ring-offset-2"
          >
            <div
              className="h-full rounded-full bg-jardinerie-primary"
              style={{ width: `${thumbWidth}%`, marginLeft: `${thumbLeft}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
