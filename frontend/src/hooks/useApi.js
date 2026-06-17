import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
/**
 * Hook personnalisé moderne pour la gestion des requêtes HTTP
 * @return {object} { data, loading, error, request }
 */
export function useApi() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (url, option = {}, showToast = true) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, option);
            const result = await response.json();

            if(!response.ok || result.status !== 200) {
                throw new Error(result.error || `Erreur HTTP : $response.status`);
            }

            setData(result.data);
            return { success: true, data: result.data };

        } catch (err) {
            // On ignore l'erreur si elle provient d'une annulation volontaire via AbortController
            if (err.name === 'AbortError') return { success : false, aborted: true };

            const errorMessage = err.message || "Une erreur est survenue.";
            setError(errorMessage);

            // Déclenchement automatique du toast d'erreur
      if (showToast) {
        toast.error(errorMessage);
      }
            return { success: false, error: errorMessage };

        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, request, setData };

}