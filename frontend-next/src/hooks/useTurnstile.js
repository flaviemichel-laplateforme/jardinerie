import { useState, useCallback } from 'react';

// Clé PUBLIQUE du widget Cloudflare Turnstile (tableau de bord Cloudflare > Turnstile). Elle n'est pas secrète : elle est visible
// dans le code de la page. La clé SECRÈTE, elle, ne vit que dans le .env de l'API.
// Sans cette variable, le contrôle anti-robots n'est pas affiché ni envoyé (l'API ne l'exige pas non plus sans sa clé secrète).
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/**
 * État du contrôle anti-robots d'un formulaire : le jeton fourni par Cloudflare une fois le contrôle réussi.
 * Un jeton ne sert qu'UNE fois : après chaque envoi refusé par l'API, appeler reset() pour en obtenir un nouveau.
 */
export function useTurnstile() {
    const [token, setToken] = useState('');
    const [resetKey, setResetKey] = useState(0);

    const reset = useCallback(() => {
        setToken('');
        setResetKey((current) => current + 1);
    }, []);

    return { enabled: TURNSTILE_SITE_KEY !== '', token, setToken, resetKey, reset };
}
