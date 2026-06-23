import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-jardinerie-bg text-jardinerie-text font-sans mt-auto">
      <div className="h-[4px] w-full bg-gradient-to-r from-transparent via-jardinerie-primary/60 to-transparent"></div>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12 md:py-16">
        
        {/* Grille : Ajout de md:justify-items-center pour un centrage parfait de chaque bloc dans sa colonne */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12 md:justify-items-center">
          
          {/* Colonne 1 : Identité visuelle */}
          <div className="flex flex-col space-y-4">
            <span className="text-xl font-bold uppercase tracking-wider text-jardinerie-text">
              La Jardinerie
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-jardinerie-text opacity-90">
              Votre spécialiste en végétaux et aménagement paysager. Nous vous accompagnons dans la création et l'entretien de vos espaces verts depuis 2026.
            </p>
          </div>

          {/* Colonne 2 : Navigation rapide */}
          <div className="flex flex-col space-y-4">
            <span className="text-sm font-bold uppercase tracking-wider text-jardinerie-text">
              Plan du site
            </span>
            <ul className="flex flex-col space-y-3 text-sm text-jardinerie-text opacity-90">
              <li>
                <Link to="/vegetaux" className="transition-colors hover:text-jardinerie-primary hover:underline hover:underline-offset-4">
                  Nos végétaux
                </Link>
              </li>
              <li>
                <Link to="/jardinage" className="transition-colors hover:text-white hover:text-jardinerie-primary hover:underline-offset-4">
                  Jardinage
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-jardinerie-primary hover:underline hover:underline-offset-4">
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Légal et Conformité (EPIC-5) */}
          <div className="flex flex-col space-y-4">
            <span className="text-sm font-bold uppercase tracking-wider text-jardinerie-text">
              Informations légales
            </span>
            <ul className="flex flex-col space-y-3 text-sm text-jardinerie-text opacity-90">
              <li>
                <Link to="/cgv" className="transition-colors hover:text-jardinerie-primary hover:underline hover:underline-offset-4">
                  Conditions Générales de Vente
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="transition-colors hover:text-jardinerie-primary hover:underline hover:underline-offset-4">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link to="/politique-confidentialite" className="transition-colors hover:text-jardinerie-primary hover:underline hover:underline-offset-4">
                  Politique de Confidentialité
                </Link>
              </li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* Bandeau de copyright */}
      <div className="w-full border-t border-jardinerie-bg/20 bg-jardinerie-primary">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-jardinerie-light opacity-80 md:flex-row md:gap-0">
          <span className="text-center">&copy; {new Date().getFullYear()} La Jardinerie. Tous droits réservés.</span>
          <span>Projet DWWM - E-commerce</span>
        </div>
      </div>
    </footer>
  );
}