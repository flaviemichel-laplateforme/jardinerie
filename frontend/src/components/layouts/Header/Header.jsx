import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import logoImage from '../../../assets/img/Logo.png';
import jardinierIcon from '../../../assets/img/icone-jardinier.svg';
import panierIcon from '../../../assets/img/icone-panier.svg';
import loupeIcon from '../../../assets/img/icone-loupe.svg';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { filterService } from '../../../services/filterService';

export default function Header() {
  const { cartCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const profileMenuRef = useRef(null);
  const {data: vegetauxFilters, request: requestVegetauxFilters } = useApi();
  const { data: jardinageFilters, request: requestJardinageFilters } = useApi();

  useEffect(() => {
    if (!isMenuOpen) return;
    if (!vegetauxFilters) requestVegetauxFilters(filterService.buildFiltersUrl('vegetaux'), {}, false);
    if (!jardinageFilters) requestJardinageFilters(filterService.buildFiltersUrl('jardinage'), {}, false);
  }, [isMenuOpen, vegetauxFilters, jardinageFilters, requestJardinageFilters, requestVegetauxFilters]
);
  // Fermeture du menu profil au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const getNavClass = ({ isActive }) =>
    isActive ? 'underline font-bold decoration-2 underline-offset-4' : 'hover:underline underline-offset-4';

  const getMobileNavClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-jardinerie-bg text-jardinerie-primary font-bold' : 'hover:bg-jardinerie-bg'}`;


  // On définit l'URL et le texte du bouton selon le rôle stocké dans le context
  const dashboardUrl = user?.role === 'admin' ? '/admin' : '/compte';
  const dashboardLabel = user?.role === 'admin' ? 'Tableau de bord administration' : 'Mon espace client';

  return (
    <header className="sticky top-0 z-40 w-full shadow-md font-sans">
      {/* Barre supérieure */}
      <div className="bg-jardinerie-bg flex items-center justify-between px-4 md:px-6 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={logoImage}
            alt="La Jardinerie"
            className="h-16 w-auto md:h-24 md:w-70 rounded-full border border-jardinerie-primary bg-white object-cover shadow-sm scale-110"
          />
        </Link>

        {/* Recherche desktop : toujours visible à partir de md */}
        <div className="hidden md:block md:flex-grow">
          <SearchBar />
        </div>

        {/* Icône loupe mobile : bascule l'affichage de la recherche repliable */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="md:hidden flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="Rechercher"
        >
          <img src={loupeIcon} alt="" className="h-10 w-10 object-contain" aria-hidden="true" />
        </button>

        {/* Icônes utilisateur & panier */}
        <div className="flex items-center space-x-4 md:space-x-12 mr-2 md:mr-10">

          {/* Zone profil — connecté ou non */}
          <div className="relative" ref={profileMenuRef}>

            {isAuthenticated ? (
              <>
                {/* Bouton profil connecté */}
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="relative">
                    <img src={jardinierIcon} alt="Profil" className="h-10 w-10 object-contain" />
                    {/* Point vert — connecté */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-jardinerie-bg" />
                  </div>
                  <span className="text-sm font-bold text-jardinerie-text hidden md:block">
                    {user?.first_name}
                  </span>
                </button>

                {/* Menu déroulant connecté */}
                {isProfileMenuOpen && user && (
                  <div className="absolute right-0 mt-3 w-48 rounded-xl bg-white p-2 shadow-xl border border-gray-100 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                      <p className="text-sm font-bold text-jardinerie-text">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      
                      {/* Petit badge pour indiquer le rôle admin si besoin */}
                      {user?.role === 'admin' && (
                        <span className="inline-block mt-1 bg-jardinerie-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ADMIN
                        </span>
                      )}
                    </div>

                    {/* LIEN DYNAMIQUE INTÉGRÉ ICI */}
                    <Link
                      to={dashboardUrl}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-jardinerie-bg hover:text-jardinerie-primary transition-colors"
                    >
                      {dashboardLabel}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full text-left rounded-lg px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Bouton profil non connecté */}
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <div className="relative">
                    <img src={jardinierIcon} alt="Mon compte" className="h-10 w-10 object-contain" />
                    {/* Point gris — non connecté */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-jardinerie-primary border-2 border-jardinerie-bg" />
                  </div>
                  <span className="text-xs font-medium text-jardinerie-text">Mon compte</span>
                </button>

                {/* Menu déroulant visiteur */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-44 rounded-xl bg-white p-2 shadow-xl border border-gray-100 z-50">
                    <Link
                      to="/connexion"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-jardinerie-text hover:bg-jardinerie-bg hover:text-jardinerie-primary transition-colors"
                    >
                      Se connecter
                    </Link>
                    <Link
                      to="/inscription"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-jardinerie-text hover:bg-jardinerie-bg hover:text-jardinerie-primary transition-colors"
                    >
                      S'inscrire
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Icône Panier */}
          <Link to="/panier" className="hover:opacity-80 transition-opacity relative flex flex-col items-center">
            <img src={panierIcon} alt="Panier" className="h-11 w-11 object-contain" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-jardinerie-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-jardinerie-bg shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>

      {/* Ligne de recherche mobile, repliable (affichée uniquement si isSearchOpen) */}
      {isSearchOpen && (
        <div className="md:hidden bg-jardinerie-bg px-4 pb-4">
          <SearchBar />
        </div>
      )}

      {/* Barre de navigation principale (Inchangée) */}
      <nav className="bg-jardinerie-primary text-jardinerie-light px-6 py-3">
        <ul className="flex items-center space-x-12 text-sm uppercase tracking-wider">
          <li className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Ouvrir le menu"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-7 rounded-full bg-jardinerie-light" />
                <span className="block h-0.5 w-7 rounded-full bg-jardinerie-light" />
                <span className="block h-0.5 w-7 rounded-full bg-jardinerie-light" />
              </span>
              <span className="text-sm font-semibold">Menu</span>
            </button>
          </li>
          <li className="hidden md:list-item"><NavLink to="/vegetaux"  className={getNavClass}>Nos végétaux</NavLink></li>
          <li className="hidden md:list-item"><NavLink to="/jardinage" className={getNavClass}>Nos produits de jardinage</NavLink></li>
          <li className="hidden md:list-item"><NavLink to="/produits"  className={getNavClass}>Tous nos produits</NavLink></li>
        </ul>
      </nav>

      {/* Menu burger latéral (Inchangé) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Fermer le menu"
        />
        <aside
          className={`relative z-10 h-full w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-jardinerie-primary/20 px-5 py-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-jardinerie-primary">Menu</span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl leading-none text-jardinerie-primary hover:opacity-70"
              aria-label="Fermer le menu"
            >
              ×
            </button>
          </div>
          <nav className="px-5 py-6">
            <ul className="space-y-4 text-jardinerie-text">
              <li>
                <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-jardinerie-bg">
                  <NavLink to="/vegetaux" onClick={() => setIsMenuOpen(false)} className={getMobileNavClass}>
                    Nos végétaux
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'vegetaux' ? null : 'vegetaux')}
                    aria-label="Déplier les catégories"
                    aria-expanded={openSection === 'vegetaux'}
                    className="p-1 text-jardinerie-primary"
                  >
                    {openSection === 'vegetaux' ? '−' : '+'}
                  </button>
                </div>
                {openSection === 'vegetaux' && (
                  <ul className="pl-6 mt-1 space-y-1">
                    {(vegetauxFilters?.categories || []).map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/vegetaux?categories=${cat.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-lg px-3 py-1.5 text-sm text-jardinerie-text/70 hover:bg-jardinerie-bg hover:text-jardinerie-primary"
                        >
                          {cat.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              <li>
                <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-jardinerie-bg">
                  <NavLink to="/jardinage" onClick={() => setIsMenuOpen(false)} className={getMobileNavClass}>
                    Jardinage
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'jardinage' ? null : 'jardinage')}
                    aria-label="Déplier les catégories"
                    aria-expanded={openSection === 'jardinage'}
                    className="p-1 text-jardinerie-primary"
                  >
                    {openSection === 'jardinage' ? '−' : '+'}
                  </button>
                </div>
                {openSection === 'jardinage' && (
                  <ul className="pl-6 mt-1 space-y-1">
                    {(jardinageFilters?.categories || []).map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/jardinage?categories=${cat.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-lg px-3 py-1.5 text-sm text-jardinerie-text/70 hover:bg-jardinerie-bg hover:text-jardinerie-primary"
                        >
                          {cat.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </header>
  );
}