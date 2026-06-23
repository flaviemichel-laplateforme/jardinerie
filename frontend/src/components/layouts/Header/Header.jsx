import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import logoImage from '../../../assets/img/Logo.png';
import jardinierIcon from '../../../assets/img/icone-jardinier.svg';
import panierIcon from '../../../assets/img/icone-panier.svg';
import { useCart } from '../../../contexts/CartContext';

export default function Header() {
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full shadow-md font-sans">
      {/* Barre supérieure */}
      <div className="bg-jardinerie-bg flex items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={logoImage}
            alt="La Jardinerie"
            className="h-24 w-70 rounded-full border border-jardinerie-primary bg-white object-cover shadow-sm scale-110"
          />
        </Link>

        <SearchBar />

        {/* Icônes utilisateur & panier */}
        <div className="flex items-center space-x-20 mr-20">
          
          {/* Icône Jardinier (Profil) */}
          <Link to="/connexion" className="hover:opacity-80 transition-opacity flex flex-col items-center">
            <img src={jardinierIcon} alt="" aria-hidden="true" className="h-11 w-11 object-contain" />
          </Link>

          {/* Icône Panier DYNAMIQUE */}
          <Link to="/panier" className="hover:opacity-80 transition-opacity relative flex flex-col items-center">
            <img src={panierIcon} alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
            
            {/* Rendu conditionnel : La pastille n'existe dans le DOM que si le panier contient au moins 1 article */}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-jardinerie-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-jardinerie-bg">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>

      {/* Barre de navigation */}
      <nav className="bg-jardinerie-primary text-jardinerie-light px-6 py-3">
        <ul className="flex items-center space-x-12 text-sm font-medium uppercase tracking-wider">
          <li>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Ouvrir le menu"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-7 rounded-full bg-jardinerie-light" />
                <span className="block h-0.5 w-7 rounded-full bg-jardinerie-light" />
                <span className="block h-0.5 w-7 rounded-full bg-jardinerie-light" />
              </span>
            </button>
          </li>
          <li><Link to="/vegetaux" className="hover:underline">Nos végétaux</Link></li>
          <li><Link to="/jardinage" className="hover:underline">Jardinage</Link></li>
        </ul>
      </nav>

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
                <Link to="/vegetaux" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-jardinerie-bg">
                  Nos végétaux
                </Link>
              </li>
              <li>
                <Link to="/jardinage" onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-jardinerie-bg">
                  Jardinage
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </header>
  );
}