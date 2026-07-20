import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const SCROLL_THRESHOLD = 400;

export default function BackToTop() {
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
            className='fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-jardinerie-primary text-white shadow-lg transition-opacity hover:opacity-80'
        >
            <ArrowUp size={22} />
        </button>
    );
}