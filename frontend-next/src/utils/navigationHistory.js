// Nombre de pages vues depuis l'arrivée sur le site (sans rechargement).
// Sert au bouton « Retour » de la fiche produit : s'il y a une page précédente sur le site, on y revient ;
// si la fiche a été ouverte directement (lien partagé, nouvel onglet, Google), il n'y a rien avant :
// on renvoie alors vers le catalogue. (L'ancienne version utilisait location.key de react-router.)
let pagesViewed = 0;

export function recordPageView() {
  pagesViewed += 1;
}

export function canGoBackInSite() {
  return pagesViewed > 1;
}
