// SOLUTION PROVISOIRE.
// Aujourd'hui, toutes les informations d'entretien d'une plante (type de sol, rusticité, arrosage, conseils...) sont
// écrites à la suite dans un seul champ texte `description`. Cette fonction les découpe pour les afficher en sections.
// Quand ces informations auront chacune leur champ en base (et dans le formulaire d'ajout de produit), cette fonction
// disparaîtra : l'affichage (ProductDescription) reçoit déjà des données structurées de la même forme.
//
// Format observé (lignes séparées par un retour à la ligne, parfois une ligne vide) :
//   introduction
//   Conditionnement : ...
//   Type de Sol : ...
//   Rusticité : ...            (peut continuer sur la ligne suivante : « Persistantes : ... »)
//   Arrosage: En été : ...
//   En hiver : ...
//   Conseils :
//   •Question ? Réponse...
//   •Maladies et ravageurs : ...
//   Nom (nom latin)             <- répète le nom latin déjà affiché sur la fiche

// Comparaison d'étiquettes sans accents ni majuscules
const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const PACKAGING_LABEL = 'conditionnement';
const CARE_LABELS = ['type de sol', 'rusticite', 'arrosage', 'en hiver'];
const TIPS_MARKER = 'conseils';

// « Type de Sol : Sol riche. » -> { label: 'Type de Sol', text: 'Sol riche.' } (étiquette courte, avant le premier « : »)
const splitLabel = (line) => {
  const match = line.match(/^([^:]{2,40}?)\s*:\s*([\s\S]*)$/);
  return match ? { label: match[1].trim(), text: match[2].trim() } : { label: '', text: line.trim() };
};

// « Rusticité Caduques » compte comme « Rusticité » : l'étiquette commence par une étiquette connue
const isCareLabel = (key) => CARE_LABELS.some((known) => key === known || key.startsWith(`${known} `));

// Dernier paragraphe de la forme « Nom (nom latin) » qui répète le nom latin déjà affiché
const repeatsLatinName = (paragraph, latinName) => {
  if (!latinName || paragraph.includes(':') || paragraph.length > 100) return false;
  const match = paragraph.match(/\(([^)]+)\)\s*$/);
  const latin = normalize(latinName);
  return normalize(paragraph).startsWith(latin) || (!!match && latin.includes(normalize(match[1])));
};

/**
 * @param {string|null} description - Le texte brut de la fiche
 * @param {string|null} latinName - Le nom latin, pour retirer le paragraphe qui le répète
 * @returns {{
 *   intro: string,
 *   packaging: { label: string, text: string } | null,
 *   care: { label: string, text: string }[],
 *   tips: { label: string, text: string }[],
 *   plain: string,
 * }}
 */
export function parseProductDescription(description, latinName) {
  const empty = { intro: '', packaging: null, care: [], tips: [], plain: '' };
  if (!description || !description.trim()) return empty;

  // Lignes, avec une marque « ligne vide avant » pour reconstituer les paragraphes
  const lines = [];
  let blankBefore = false;
  description.replace(/\r\n/g, '\n').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      blankBefore = true;
      return;
    }
    lines.push({ text: line, blankBefore });
    blankBefore = false;
  });
  if (lines.length === 0) return empty;

  // Dernier paragraphe répétant le nom latin : retiré (il est déjà affiché sur la fiche)
  const last = lines[lines.length - 1];
  if (lines.length > 1 && last.blankBefore && repeatsLatinName(last.text, latinName)) lines.pop();

  const intro = [];
  const care = [];
  const tips = [];
  let packaging = null;
  let mode = 'intro';
  let recognized = false;

  // Ajoute une ligne à la suite d'un texte : nouveau paragraphe si une ligne vide la précédait
  const append = (current, line) => `${current}${line.blankBefore ? '\n\n' : ' '}${line.text}`;

  lines.forEach((line) => {
    const isBullet = line.text.startsWith('•');
    const { label, text } = splitLabel(isBullet ? line.text.replace(/^•\s*/, '') : line.text);
    const key = normalize(label);

    if (!isBullet && key === PACKAGING_LABEL) {
      packaging = { label, text };
      mode = 'packaging';
      recognized = true;
    } else if (!isBullet && isCareLabel(key)) {
      care.push({ label, text });
      mode = 'care';
      recognized = true;
    } else if (!isBullet && key === TIPS_MARKER) {
      mode = 'tips';
      recognized = true;
      if (text) tips.push({ label: '', text });
    } else if (mode === 'tips') {
      // Après « Conseils : » : une puce ou une ligne étiquetée (À noter, Attention...) est un nouveau conseil
      if (isBullet || label) tips.push(label ? { label, text } : { label: '', text: line.text.replace(/^•\s*/, '') });
      else if (tips.length > 0) tips[tips.length - 1].text = append(tips[tips.length - 1].text, line);
      else tips.push({ label: '', text: line.text });
      recognized = true;
    } else if (isBullet) {
      // Puce avant tout « Conseils : » : on la garde avec les conseils
      tips.push(label ? { label, text } : { label: '', text: line.text.replace(/^•\s*/, '') });
      recognized = true;
    } else if (mode === 'care' && care.length > 0) {
      // Suite d'un soin sur la ligne suivante (ex. « Persistantes : ... » après « Rusticité Caduques : ... »)
      care[care.length - 1].text = append(care[care.length - 1].text, line);
    } else if (mode === 'packaging' && packaging) {
      packaging.text = append(packaging.text, line);
    } else {
      intro.push(line);
    }
  });

  // Aucune étiquette reconnue (produits de jardinage, descriptions d'une ligne...) : texte brut, comme avant,
  // en gardant les retours à la ligne d'origine (ex. « Marque : Fiskars » sur sa propre ligne)
  if (!recognized) {
    return {
      ...empty,
      plain: intro.reduce((acc, line, i) => (i === 0 ? line.text : `${acc}${line.blankBefore ? '\n\n' : '\n'}${line.text}`), ''),
    };
  }

  return {
    intro: intro.reduce((acc, line, i) => (i === 0 ? line.text : `${acc}${line.blankBefore ? '\n\n' : ' '}${line.text}`), ''),
    packaging,
    care,
    tips,
    plain: '',
  };
}
