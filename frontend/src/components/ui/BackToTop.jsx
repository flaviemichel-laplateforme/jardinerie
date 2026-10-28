import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const SCROLL_THRESHOLD = 400;

// bottomClass : position verticale du bouton. Sur mobile, MainLayout le remonte au-dessus de la barre
// collée en bas de l'écran (barre de filtre du catalogue, barre d'achat de la fiche produit).
export default function BackToTop({ bottomClass = 'bottom-6' }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const HandleScroll = () => {

            setIsVisible(window.scrollY > SCROLL_THRESHOLD);
            };
        window.addEventListener('scroll', HandleScroll);

        return () => {
            window.removeEventListener('scroll', HandleScroll);
        };
    }, [] );

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isVisible) return null;

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Retour en haut de la page"
            className={`fixed right-6 z-30 ${bottomClass} flex h-12 w-12 items-center justify-center rounded-full bg-jardinerie-primary text-white shadow-lg ring-2 ring-white transition-opacity hover:opacity-80`}
        >
            <ArrowUp size={22} />
        </button>
    );
}