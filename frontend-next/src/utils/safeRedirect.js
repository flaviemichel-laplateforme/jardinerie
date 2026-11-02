/**
 * Adresse vers laquelle renvoyer après la connexion (paramètre ?redirect=/panier).
 * Ce paramètre vient de l'URL, donc d'un tiers potentiel : on n'accepte qu'un chemin DU SITE, sinon un lien piégé
 * (/connexion?redirect=//site-pirate.com) renverrait la personne connectée vers un faux site (« redirection ouverte »).
 */
export function safeRedirect(target, fallback = '/compte') {
    if (typeof target !== 'string' || target === '') return fallback;

    const isSitePath = target.startsWith('/') && !target.startsWith('//');
    // Les navigateurs ignorent tabulations et retours à la ligne dans une adresse : « /<tab>/site.com » deviendrait « //site.com »
    const hasTrickyCharacters = /[\\\u0000-\u001f]/.test(target);

    return isSitePath && !hasTrickyCharacters ? target : fallback;
}
