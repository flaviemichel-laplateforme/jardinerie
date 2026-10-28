import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export default function Sidebar({ userName = 'Invité', userRole = 'customer' }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const customerLinks = [
    {
      name: 'Retour à la boutique',
      shortName: 'Boutique',
      path: '/',
      target: '_blank', // 👉 S'ouvre dans un nouvel onglet
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M9 21V12H15V21" fill="#88B04B" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'Tableau de bord',
      shortName: 'Compte',
      path: '/compte',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="9" rx="1" fill="#7DCEB2" stroke="#2B3A67" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="5" rx="1" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <rect x="3" y="16" width="7" height="5" rx="1" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <rect x="14" y="12" width="7" height="9" rx="1" fill="#88B04B" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'Mes commandes',
      shortName: 'Commandes',
      path: '/compte/commandes',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="#F4A261" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M3 12L12 17L21 12" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 17L12 22L21 17" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      name: 'Mes adresses',
      shortName: 'Adresses',
      path: '/compte/adresses',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <circle cx="12" cy="9" r="2.5" fill="#88B04B" stroke="#2B3A67" strokeWidth="1.5"/>
        </svg>
      )
    },
    {
      name: 'Mon profil',
      shortName: 'Profil',
      path: '/compte/parametres',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="#FFCDB2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M4 20C4 16.134 7.13401 13 11 13H13C16.866 13 20 16.134 20 20" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'Confidentialité & RGPD',
      shortName: 'RGPD',
      path: '/compte/rgpd',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M9 12L11 14L15 10" stroke="#88B04B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  const adminLinks = [
    {
      name: 'RETOUR À LA BOUTIQUE',
      shortName: 'Boutique',
      path: '/',
      target: '_blank', // 👉 S'ouvre dans un nouvel onglet
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M9 21V12H15V21" fill="#88B04B" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'TABLEAU DE BORD',
      shortName: 'Tableau',
      path: '/admin', // 👉 Simplifié pour correspondre à la route d'accueil Admin
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="9" rx="1" fill="#7DCEB2" stroke="#2B3A67" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="5" rx="1" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <rect x="3" y="16" width="7" height="5" rx="1" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <rect x="14" y="12" width="7" height="9" rx="1" fill="#88B04B" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'GESTION DU CATALOGUE',
      shortName: 'Catalogue',
      path: '/admin/catalogue',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M2 3H22V6H2Z" fill="#F4A261" stroke="#2B3A67" strokeWidth="2"/>
          <circle cx="12" cy="13" r="2" fill="#88B04B" stroke="#2B3A67" strokeWidth="1.5"/>
        </svg>
      )
    },
    {
      name: 'GESTION DES COMMANDES',
      shortName: 'Commandes',
      path: '/admin/commandes', // 👉 Correction du lien (orders -> commandes)
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="#F4A261" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M3 12L12 17L21 12" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 17L12 22L21 17" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'GESTION DES CLIENTS',
      shortName: 'Clients',
      path: '/admin/clients',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" fill="#E63946" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M4 20C4 16.134 7.13401 13 11 13H13C16.866 13 20 16.134 20 20" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'MON PROFIL',
      shortName: 'Profil',
      path: '/admin/profil',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" fill="#FFCDB2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M4 20C4 16.134 7.13401 13 11 13H13C16.866 13 20 16.134 20 20" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    }

  ];

  const links = userRole === 'admin' ? adminLinks : customerLinks;

  // La page est active si on est dessus ou sur une de ses sous-pages (ex. /compte/commandes/12). Les pages d'accueil
  // de chaque espace (/compte, /admin) sont comparées strictement, sinon elles resteraient actives partout.
  const isLinkActive = (link) =>
    ['/', '/compte', '/admin'].includes(link.path)
      ? location.pathname === link.path
      : location.pathname.startsWith(link.path);
  // La barre du bas (mobile) n'a de la place que pour les liens internes, pas le lien externe "retour boutique".
  const mobileBarLinks = links.filter((link) => link.target !== '_blank');

  return (
    <>
      {/* ===================================================== */}
      {/* NIVEAU 1 — MOBILE (< md) : barre fixe en bas, icône + libellé court */}
      {/* ===================================================== */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-jardinerie-primary/20 bg-jardinerie-bg pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
        aria-label={userRole === 'admin' ? "Navigation de l'administration" : 'Navigation du compte'}
      >
        {mobileBarLinks.map((link) => {
          const isActive = isLinkActive(link);
          return (
            <Link
              key={link.name}
              to={link.path}
              title={link.name}
              aria-current={isActive ? 'page' : undefined}
              // flex-1 : chaque entrée prend la même largeur. Texte en pleine couleur (et non atténué) : un petit
              // texte pâle sur le fond beige n'aurait pas un contraste suffisant.
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10.5px] tracking-tight leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jardinerie-primary ${
                isActive ? 'font-bold text-jardinerie-primary' : 'font-medium text-jardinerie-text'
              }`}
            >
              {/* La page active n'est pas signalée par la seule couleur : un trait en haut de l'entrée */}
              {isActive && <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-jardinerie-primary" />}
              <span className="flex-shrink-0 scale-90">{link.icon}</span>
              <span className="w-full truncate text-center">{link.shortName}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          title="Déconnexion"
          aria-label="Quitter (déconnexion)"
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10.5px] tracking-tight font-medium leading-tight text-jardinerie-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jardinerie-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="my-px">
            <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 17L21 12L16 7" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="w-full truncate text-center">Quitter</span>
        </button>
      </nav>

      {/* ===================================================== */}
      {/* NIVEAU 2 — TABLETTE (md à lg) : rail latéral, icônes seules */}
      {/* ===================================================== */}
      <aside className="hidden md:flex lg:hidden w-20 flex-col items-center gap-3 border-r border-jardinerie-primary/20 bg-jardinerie-bg py-6 min-h-screen sticky top-[172px] self-start">
        {links.map((link) => {
          const isActive = isLinkActive(link);
          return (
            <Link
              key={link.name}
              to={link.path}
              target={link.target || '_self'}
              rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
              title={link.name}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-jardinerie-primary text-white shadow-md'
                  : 'text-jardinerie-text hover:bg-white hover:shadow-sm'
              }`}
            >
              {link.icon}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          title="Déconnexion"
          className="mt-auto flex h-11 w-11 items-center justify-center rounded-full text-jardinerie-text hover:bg-white hover:shadow-sm transition-all duration-200"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 17L21 12L16 7" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </aside>

      {/* ===================================================== */}
      {/* NIVEAU 3 — DESKTOP (lg et +) : sidebar complète, repliable (inchangée) */}
      {/* ===================================================== */}
      <aside className={`hidden lg:flex flex-col min-h-screen sticky top-[172px] self-start bg-jardinerie-bg border-r border-jardinerie-primary/20 font-sans shadow-inner transition-all duration-300 ${isCollapsed ? 'w-20 p-4' : 'w-72 p-6'}`}>
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-jardinerie-primary shadow-sm border border-jardinerie-primary/20 hover:opacity-80 transition-opacity"
            aria-label={isCollapsed ? 'Déplier la sidebar' : 'Replier la sidebar'}
            aria-pressed={isCollapsed}
          >
            <span className="text-lg leading-none">{isCollapsed ? '›' : '‹'}</span>
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col items-center mb-10 mt-4">
            <div className="w-20 h-20 bg-jardinerie-primary rounded-full mb-4 flex items-center justify-center text-white shadow-md border-2 border-white">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" fill="#FFCDB2"/>
                <path d="M4 20C4 16.134 7.13401 13 11 13H13C16.866 13 20 16.134 20 20" fill="white"/>
              </svg>
            </div>
            <p className="text-jardinerie-text font-bold uppercase text-xs tracking-widest text-center">
              Bonjour, {userName} !
            </p>
          </div>
        )}

        <nav className={`flex flex-col flex-grow ${isCollapsed ? 'space-y-3' : 'space-y-2'}`}>
          {links.map((link) => {
            const isActive = isLinkActive(link);

            return (
              <Link
                key={link.name}
                to={link.path}
                target={link.target || '_self'} //Gestion dynamique de l'ouverture d'onglet
                rel={link.target === '_blank' ? 'noopener noreferrer' : undefined} // Sécurité standard
                title={isCollapsed ? link.name : undefined}
                className={`py-3.5 text-xs tracking-wider flex items-center transition-all duration-200 uppercase ${isActive
                  ? 'bg-jardinerie-primary text-white rounded-full font-bold shadow-md scale-[1.02]'
                  : 'text-jardinerie-text font-semibold hover:bg-white hover:text-jardinerie-primary hover:rounded-full shadow-sm hover:shadow'
                } ${isCollapsed ? 'justify-center px-0 gap-0' : 'px-5 gap-4'}`}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                {!isCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-jardinerie-primary/20">
          <button
            onClick={handleLogout}
            type="button"
            title={isCollapsed ? 'Déconnexion' : undefined}
            className={`w-full py-3.5 text-xs font-bold tracking-wider flex items-center text-jardinerie-text hover:bg-white hover:text-red-600 hover:rounded-full transition-all duration-200 uppercase shadow-sm hover:shadow ${isCollapsed ? 'justify-center px-0 gap-0' : 'text-left px-5 gap-4'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 17L21 12L16 7" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {!isCollapsed && <span>DÉCONNEXION</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
