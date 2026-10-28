import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-jardinerie-bg text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white',
  danger: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white',
};

/**
 * Bouton d'action des cartes de l'administration sur mobile (liste de commandes, de clients, de produits).
 * Hauteur de 44 px : cible tactile confortable, là où le tableau desktop utilise des boutons plus petits.
 * Avec `to`, c'est un lien ; sinon un bouton.
 *
 * @param {string} [to] - Adresse interne : rend un <Link>
 * @param {'primary'|'danger'} [variant]
 */
export default function AdminCardAction({ to, variant = 'primary', className = '', ...props }) {
  const classes = `flex min-h-[44px] flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2 ${VARIANTS[variant]} ${className}`;

  if (to) return <Link to={to} className={classes} {...props} />;
  return <button type="button" className={classes} {...props} />;
}
