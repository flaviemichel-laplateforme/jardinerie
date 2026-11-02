'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MapPin, User, ShieldCheck, Store, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LINKS = [
  { name: 'Tableau de bord', shortName: 'Compte', href: '/compte', Icon: LayoutDashboard, exact: true },
  { name: 'Mes commandes', shortName: 'Commandes', href: '/compte/commandes', Icon: Package },
  { name: 'Mes adresses', shortName: 'Adresses', href: '/compte/adresses', Icon: MapPin },
  { name: 'Mon profil', shortName: 'Profil', href: '/compte/parametres', Icon: User },
  { name: 'Confidentialité & RGPD', shortName: 'RGPD', href: '/compte/rgpd', Icon: ShieldCheck },
];

/**
 * Navigation de l'espace client, en deux présentations :
 * - mobile (< md) : barre fixe en bas de l'écran, icône + libellé court ;
 * - à partir de md : colonne à gauche (icônes seules sur tablette, icônes + libellés dès lg).
 */
export default function AccountSidebar() {
  const pathname = usePathname();
  const { user, endSession } = useAuth();

  // La page d'accueil du compte ne doit être active que sur elle-même ; les autres le sont aussi sur leurs sous-pages
  const isActive = (link) => (link.exact ? pathname === link.href : pathname.startsWith(link.href));

  const handleLogout = () => endSession('/');

  return (
    <>
      {/* Mobile : barre du bas */}
      <nav
        aria-label="Navigation du compte"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-jardinerie-primary/20 bg-jardinerie-bg pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden"
      >
        {LINKS.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.name}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10.5px] leading-tight tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jardinerie-primary ${
                active ? 'font-bold text-jardinerie-primary' : 'font-medium text-jardinerie-text'
              }`}
            >
              {/* La page active n'est pas signalée par la couleur seule : un trait en haut de l'entrée */}
              {active && <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-jardinerie-primary" />}
              <link.Icon size={20} aria-hidden="true" />
              <span className="w-full truncate text-center">{link.shortName}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Se déconnecter"
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10.5px] font-medium leading-tight tracking-tight text-jardinerie-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jardinerie-primary"
        >
          <LogOut size={20} className="text-red-500" aria-hidden="true" />
          <span className="w-full truncate text-center">Quitter</span>
        </button>
      </nav>

      {/* Tablette et ordinateur : colonne de gauche */}
      <aside className="hidden w-16 shrink-0 md:block lg:w-64">
        <nav
          aria-label="Navigation du compte"
          className="flex flex-col gap-2 rounded-2xl border border-jardinerie-primary/20 bg-jardinerie-bg p-2 lg:p-4"
        >
          <p className="hidden px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-widest text-jardinerie-text lg:block">
            Bonjour, {user?.first_name} !
          </p>

          {LINKS.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.name}
                aria-label={link.name}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center gap-3 rounded-full px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary lg:justify-start lg:px-5 ${
                  active ? 'bg-jardinerie-primary text-white shadow-md' : 'text-jardinerie-text hover:bg-white hover:text-jardinerie-primary'
                }`}
              >
                <link.Icon size={20} aria-hidden="true" className="shrink-0" />
                <span className="hidden lg:inline">{link.name}</span>
              </Link>
            );
          })}

          <div className="mt-2 flex flex-col gap-2 border-t border-jardinerie-primary/20 pt-3">
            <Link
              href="/"
              title="Retour à la boutique"
              aria-label="Retour à la boutique"
              className="flex items-center justify-center gap-3 rounded-full px-3 py-3 text-xs font-semibold uppercase tracking-wider text-jardinerie-text transition-colors hover:bg-white hover:text-jardinerie-primary lg:justify-start lg:px-5"
            >
              <Store size={20} aria-hidden="true" className="shrink-0" />
              <span className="hidden lg:inline">Retour à la boutique</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="flex items-center justify-center gap-3 rounded-full px-3 py-3 text-xs font-bold uppercase tracking-wider text-jardinerie-text transition-colors hover:bg-white hover:text-red-600 lg:justify-start lg:px-5"
            >
              <LogOut size={20} aria-hidden="true" className="shrink-0" />
              <span className="hidden lg:inline">Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
