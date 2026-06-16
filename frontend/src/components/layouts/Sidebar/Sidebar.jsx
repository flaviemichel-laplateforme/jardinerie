import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ userName = 'Admin' }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const adminLinks = [
    {
      name: 'ACCUEIL',
      path: '/admin',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M9 21V12H15V21" fill="#88B04B" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'TABLEAU DE BORD',
      path: '/admin/dashboard',
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
      path: '/admin/catalog',
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
      path: '/admin/orders',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="#F4A261" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M3 12L12 17L21 12" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 17L12 22L21 17" stroke="#2B3A67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'CLIENTS',
      path: '/admin/clients',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" fill="#E63946" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M4 20C4 16.134 7.13401 13 11 13H13C16.866 13 20 16.134 20 20" fill="#EDF0E2" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    },
    {
      name: 'PARAMÈTRES',
      path: '/admin/settings',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" fill="#7DCEB2" stroke="#2B3A67" strokeWidth="2"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#2B3A67" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  return (
    <aside className={`hidden md:flex flex-col min-h-screen bg-jardinerie-bg border-r border-jardinerie-primary/20 font-sans shadow-inner transition-all duration-300 ${isCollapsed ? 'w-20 p-4' : 'w-72 p-6'}`}>
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
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.name}
              to={link.path}
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
  );
}