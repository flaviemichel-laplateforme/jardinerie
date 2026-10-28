import { ChevronDown } from 'lucide-react';
import { linkify } from '../../utils/linkify';

// Une section repliable. <details> / <summary> natifs : le clavier (Entrée, Espace) et les lecteurs d'écran
// sont gérés par le navigateur, sans JavaScript.
function Section({ title, defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} className="group border-t border-gray-100">
      <summary className="-mx-2 flex min-h-[48px] cursor-pointer list-none items-center justify-between rounded px-2 py-3 font-bold text-jardinerie-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={20} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

/**
 * Description d'un produit : l'introduction et le conditionnement restent visibles, l'entretien et les conseils
 * se replient. Reçoit des données déjà structurées : elle ne sait rien du texte brut d'origine. Le jour où chaque
 * information d'entretien aura son champ en base, elle les recevra directement, sans changement ici.
 *
 * @param {string} intro - Introduction
 * @param {{ label: string, text: string } | null} packaging - Conditionnement (info d'achat, toujours visible)
 * @param {{ label: string, text: string }[]} care - Entretien (type de sol, rusticité, arrosage...)
 * @param {{ label: string, text: string }[]} tips - Conseils
 * @param {string} plain - Texte brut, pour les produits sans informations structurées (ex. jardinage)
 */
export default function ProductDescription({ intro, packaging, care, tips, plain }) {
  return (
    <div className="leading-relaxed text-gray-600">
      {plain && <p className="whitespace-pre-line">{linkify(plain)}</p>}

      {intro && <p className="mb-3 whitespace-pre-line">{linkify(intro)}</p>}

      {packaging && (
        <p className="mb-4">
          <span className="font-bold text-jardinerie-text">{packaging.label} :</span> {linkify(packaging.text)}
        </p>
      )}

      {care.length > 0 && (
        <Section title="Entretien" defaultOpen>
          <dl className="space-y-3">
            {care.map((item, index) => (
              <div key={`${item.label}-${index}`}>
                <dt className="font-bold text-jardinerie-text">{item.label}</dt>
                <dd className="whitespace-pre-line">{linkify(item.text)}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {tips.length > 0 && (
        <Section title="Conseils">
          <ul className="space-y-3 pl-5 marker:text-jardinerie-primary list-disc">
            {tips.map((tip, index) => (
              <li key={`${tip.label}-${index}`} className="pl-1">
                {tip.label && <span className="font-bold text-jardinerie-text">{tip.label} : </span>}
                <span className="whitespace-pre-line">{linkify(tip.text)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
