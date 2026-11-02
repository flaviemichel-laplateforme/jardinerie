import { useState, useEffect, useCallback } from 'react';

/** Compte à rebours en secondes (utilisé pour le délai « réessayez dans… » après un blocage 429). */
export function useCountdown() {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    const start = useCallback((seconds) => setSecondsLeft(Math.max(0, Math.ceil(seconds))), []);

    return { secondsLeft, start };
}
