'use client';

import { useEffect, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY } from '../../hooks/useTurnstile';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Le script de Cloudflare n'est chargé qu'une fois, même si plusieurs formulaires s'affichent l'un après l'autre
let scriptPromise = null;

function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve();

    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => {
                scriptPromise = null; // permet de réessayer à l'affichage suivant
                reject(new Error('Script Turnstile non chargé'));
            };
            document.head.appendChild(script);
        });
    }

    return scriptPromise;
}

/**
 * Contrôle anti-robots Cloudflare Turnstile.
 * - onToken(jeton) : appelé quand le contrôle est réussi ; onToken('') quand le jeton expire ou en cas d'erreur
 * - resetKey : à incrémenter pour recommencer le contrôle (un jeton ne sert qu'une fois)
 * Ne s'affiche pas sans clé publique (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 */
export default function TurnstileWidget({ onToken, resetKey = 0 }) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const onTokenRef = useRef(onToken);
    const [loadFailed, setLoadFailed] = useState(false);

    // Toujours la dernière version de la fonction, sans recréer le widget à chaque affichage du formulaire
    useEffect(() => {
        onTokenRef.current = onToken;
    });

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) return;

        let cancelled = false;

        loadTurnstileScript()
            .then(() => {
                if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    language: 'fr',
                    theme: 'light',
                    callback: (token) => onTokenRef.current(token),
                    'expired-callback': () => onTokenRef.current(''),
                    'error-callback': () => onTokenRef.current(''),
                });
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true);
            });

        return () => {
            cancelled = true;
            if (widgetIdRef.current !== null) {
                window.turnstile?.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, []);

    // Nouveau contrôle demandé par le formulaire (le jeton précédent est « consommé »)
    useEffect(() => {
        if (resetKey > 0 && widgetIdRef.current !== null) {
            window.turnstile?.reset(widgetIdRef.current);
        }
    }, [resetKey]);

    if (!TURNSTILE_SITE_KEY) return null;

    if (loadFailed) {
        return (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                La vérification de sécurité n&apos;a pas pu se charger. Désactivez votre bloqueur de publicités pour ce site,
                puis rechargez la page.
            </p>
        );
    }

    return <div ref={containerRef} className="flex min-h-[65px] justify-center" />;
}
