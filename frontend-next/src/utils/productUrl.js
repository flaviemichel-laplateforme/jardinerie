// Adresse d'une fiche produit, lisible par les visiteurs et par Google : /produit/12-monstera-deliciosa.
// L'identifiant reste en tête : c'est lui qui sert à retrouver le produit, le reste n'est que du texte.

/** "Érable du Japon" -> "erable-du-japon" */
export function slugify(text = '') {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Accepte un produit de l'API (product_name) ou un objet { id, name }. */
export function productPath(product) {
  const slug = slugify(product.product_name ?? product.name ?? '');
  return `/produit/${product.id}${slug ? `-${slug}` : ''}`;
}
