import { useState, useCallback } from 'react';
import { sendJson } from '../services/requestJson';
import { useCountdown } from './useCountdown';

/**
 * Envoi d'un formulaire à l'API : état « en cours », message d'erreur du serveur, et blocage du bouton pendant le délai
 * d'attente quand l'API répond 429 (trop de tentatives).
 */
export function useFormRequest() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { secondsLeft, start } = useCountdown();

    const send = useCallback(async (url, body, method = 'POST') => {
        setSubmitting(true);
        setError('');

        const result = await sendJson(url, { method, body });

        setSubmitting(false);
        if (!result.ok) {
            setError(result.message);
            if (result.status === 429) start(result.retryAfter);
        }
        return result;
    }, [start]);

    return { send, submitting, error, setError, secondsLeft };
}
