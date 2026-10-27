import { useEffect, useId, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

// Éléments atteignables au clavier à l'intérieur du panneau (pour le piège à focus)
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href]';

// Anneau de focus commun à tous les contrôles de ce composant
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2';

/**
 * Filtres du catalogue pour mobile et tablette (affichés sous le breakpoint lg).
 * Trois éléments :
 *  - une barre collante de pastilles (les filtres actifs), sous le header ;
 *  - une barre rectangulaire collée en bas de l'écran, qui ouvre le panneau ;
 *  - le panneau coulissant qui contient les filtres (children).
 *
 * @param {{ key: string, label: string, onRemove: function }[]} chips - Filtres actifs
 * @param {number} activeCount - Nombre de filtres actifs
 * @param {number} [resultCount] - Nombre de résultats affiché dans les barres
 * @param {function} onReset - Efface tous les filtres
 * @param {React.ReactNode} children - Le contenu des filtres (cases à cocher, prix...)
 */
export default function MobileFilters({ chips, activeCount, resultCount, onReset, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  // Tant que le panneau est ouvert : on bloque le défilement de la page, on gère Échap
  // et Tab (le focus reste dans le panneau). À la fermeture, le focus revient sur le
  // bouton "Filtrer" : indispensable pour ne pas perdre un utilisateur au clavier.
  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Boucle : Tab sur le dernier élément revient au premier, et inversement avec Maj+Tab
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  const hasResultCount = typeof resultCount === 'number';
  const resultLabel = hasResultCount ? `${resultCount} résultat${resultCount > 1 ? 's' : ''}` : '';
  const triggerLabel =
    activeCount > 0 ? `Filtrer, ${activeCount} filtre${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}` : 'Filtrer';

  return (
    <>
      {/* ===== Pastilles des filtres actifs (collées sous le header) ===== */}
      {activeCount > 0 && (
        <div
          // top = hauteur réelle du header, publiée par Header.jsx (repli 140px)
          style={{ top: 'var(--header-h, 140px)' }}
          className="sticky z-30 -mb-4 bg-white py-2 shadow-[0_3px_6px_-3px_rgba(0,0,0,0.2)] lg:hidden"
        >
          <ul
            aria-label="Filtres actifs"
            className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chips.map((chip) => (
              <li key={chip.key} className="shrink-0">
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Retirer le filtre ${chip.label}`}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-jardinerie-primary bg-white px-3 py-1.5 text-xs font-bold text-jardinerie-text ${focusRing}`}
                >
                  {chip.label}
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
            {chips.length > 1 && (
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={onReset}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-red-600 underline ${focusRing}`}
                >
                  Tout effacer
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ===== Barre rectangulaire en bas =====
        sticky + order-last (et non fixed) : elle reste collée en bas de l'écran pendant
        le défilement, mais s'arrête à la fin de la liste, donc ne recouvre jamais le footer. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
        className={`sticky bottom-3 z-30 order-last flex min-h-[48px] items-center justify-between rounded-[10px] bg-jardinerie-primary px-4 text-white shadow-lg lg:hidden ${focusRing}`}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtrer
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-jardinerie-primary">
              {activeCount}
            </span>
          )}
        </span>
        {hasResultCount && <span className="text-xs opacity-90">{resultLabel}</span>}
      </button>

      {/* ===== Panneau coulissant ===== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fond sombre : un clic dessus ferme le panneau (la touche Échap fait de même) */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fermer les filtres"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-sheet-up absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h2 id={titleId} className="font-bold uppercase tracking-wider text-jardinerie-text">
                Filtres
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer les filtres"
                className={`flex h-10 w-10 items-center justify-center rounded-full text-jardinerie-text hover:bg-jardinerie-bg ${focusRing}`}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Corps : les filtres défilent, l'entête et le pied restent visibles */}
            <div className="flex-1 overflow-y-auto px-5 pt-5">{children}</div>

            <div className="flex items-center gap-3 border-t border-gray-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className={`rounded px-1 text-sm font-bold text-red-600 underline ${focusRing}`}
                >
                  Effacer tout
                </button>
              )}
              {/* Les filtres s'appliquent en direct : ce bouton ferme simplement le panneau */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`min-h-[48px] flex-1 rounded-[10px] bg-jardinerie-primary px-4 text-sm font-bold text-white ${focusRing}`}
              >
                {hasResultCount ? `Voir ${resultLabel}` : 'Voir les résultats'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
