import { ChevronDown } from 'lucide-react';
import {
  FOLIAGE_LABELS,
  DROUGHT_LABELS,
  DIFFICULTY_LABELS,
  PACKAGING_LABELS,
  MONTHS,
  MONTHS_SHORT,
} from '../../constants/plantAttributes';

const hasValue = (value) => value !== null && value !== undefined && value !== '';

// 150 -> "1,5 m" ; 60 -> "60 cm"
function formatHeight(cm) {
  return cm >= 100 ? `${String(cm / 100).replace('.', ',')} m` : `${cm} cm`;
}

// "En pot, pot de 17 cm, 2 L"
function formatPackaging({ packaging_type, pot_diameter_cm, volume_l }) {
  const parts = [
    PACKAGING_LABELS[packaging_type],
    hasValue(pot_diameter_cm) && `pot de ${pot_diameter_cm} cm`,
    hasValue(volume_l) && `${String(Number(volume_l)).replace('.', ',')} L`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Une période peut traverser le changement d'année : décembre (12) → mars (3)
function isInPeriod(month, start, end) {
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

/** Calendrier sur 12 mois : une ligne par période (floraison, récolte), les mois concernés colorés. */
function SeasonCalendar({ periods }) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 font-bold text-jardinerie-text">Calendrier</h3>
      <table className="w-full table-fixed border-separate border-spacing-0.5 text-center text-xs">
        <caption className="sr-only">Mois de floraison et de récolte</caption>
        <thead>
          <tr>
            <th scope="col" className="w-20 sm:w-24"><span className="sr-only">Période</span></th>
            {MONTHS_SHORT.map((letter, index) => (
              <th key={MONTHS[index]} scope="col" className="font-medium text-gray-500">
                <abbr title={MONTHS[index]} className="no-underline">{letter}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period.label}>
              <th scope="row" className="pr-2 text-left font-medium text-gray-700">{period.label}</th>
              {MONTHS.map((monthName, index) => {
                const active = isInPeriod(index + 1, period.start, period.end);
                return (
                  <td key={monthName} className={`h-6 rounded-sm ${active ? period.colorClass : 'bg-gray-100'}`}>
                    <span className="sr-only">{active ? `${monthName} : oui` : `${monthName} : non`}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Le même calendrier en une phrase : plus simple à lire pour tout le monde, et pour Google */}
      <ul className="mt-2 space-y-0.5 text-sm text-gray-600">
        {periods.map((period) => (
          <li key={period.label}>
            {period.label} : de {MONTHS[period.start - 1]} à {MONTHS[period.end - 1]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Fiche détaillée d'un produit (données du Lot A) : caractéristiques, conditionnement, calendrier de floraison et de
 * récolte, conseils d'entretien et critères (sol, pH, comestible…). Chaque partie n'apparaît que si elle est renseignée ;
 * sans aucune donnée, la section entière disparaît. Composant serveur : tout est dans le HTML envoyé à Google.
 *
 * @param {object} product - Produit renvoyé par l'API (GET /api/products/{id})
 */
export default function ProductBotanicalSheet({ product }) {
  const facts = [
    ['Famille', product.family],
    ['Variété', product.cultivar],
    ['Feuillage', FOLIAGE_LABELS[product.foliage]],
    ['Hauteur à maturité', hasValue(product.height_max_cm) && formatHeight(product.height_max_cm)],
    ['Rusticité', hasValue(product.hardiness_min_c) && `Jusqu’à ${product.hardiness_min_c} °C`],
    ['Entretien', DIFFICULTY_LABELS[product.difficulty]],
    ['Tolérance à la sécheresse', DROUGHT_LABELS[product.drought_tolerance]],
    ['Conditionnement', formatPackaging(product)],
  ].filter(([, value]) => value);

  const periods = [
    { label: 'Floraison', start: product.bloom_start_month, end: product.bloom_end_month, colorClass: 'bg-jardinerie-brown' },
    { label: 'Récolte', start: product.harvest_start_month, end: product.harvest_end_month, colorClass: 'bg-jardinerie-primary' },
  ].filter((period) => hasValue(period.start) && hasValue(period.end));

  const careTips = [
    ['Taille', product.care_pruning],
    ['Rempotage', product.care_repotting],
    ['Maladies et ravageurs', product.care_pests_diseases],
  ].filter(([, text]) => hasValue(text));

  const criteria = product.criteria ?? [];

  if (facts.length === 0 && periods.length === 0 && careTips.length === 0 && criteria.length === 0) return null;

  const title = product.plant_id ? 'Fiche botanique' : 'Caractéristiques';

  return (
    <section
      aria-labelledby="fiche-produit-titre"
      className="border-t border-gray-100 bg-white px-4 py-6 md:mb-6 md:rounded-lg md:border md:border-gray-200 md:p-6"
    >
      <h2 id="fiche-produit-titre" className="mb-4 text-lg font-bold text-jardinerie-text">{title}</h2>

      {criteria.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="Critères">
          {criteria.map((criterion) => (
            <li key={criterion.id} className="rounded-full bg-jardinerie-bg px-3 py-1 text-sm font-medium text-jardinerie-text">
              {criterion.label}
            </li>
          ))}
        </ul>
      )}

      {facts.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="border-b border-gray-100 pb-2">
              <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
              <dd className="font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {periods.length > 0 && <SeasonCalendar periods={periods} />}

      {careTips.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-1 font-bold text-jardinerie-text">Conseils d’entretien</h3>
          {/* <details> natif, comme dans la description : clavier et lecteurs d'écran gérés sans JavaScript */}
          {careTips.map(([label, text]) => (
            <details key={label} className="group border-t border-gray-100">
              <summary className="-mx-2 flex min-h-[48px] cursor-pointer list-none items-center justify-between rounded px-2 py-3 font-medium text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary [&::-webkit-details-marker]:hidden">
                {label}
                <ChevronDown size={20} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="whitespace-pre-line pb-4 text-sm leading-relaxed text-gray-700">{text}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
