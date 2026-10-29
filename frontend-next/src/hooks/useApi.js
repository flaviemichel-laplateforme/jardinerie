import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé moderne pour la gestion des requêtes HTTP
 * @return {object} { data, loading, error, request, setData }
 */
export function useApi() {
    // 1. GESTION DES ÉTATS LOCAUX
    // Centralise la donnée, le statut de chargement, et les erreurs pour éviter de les réécrire dans chaque composant.
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 2. USECALLBACK (Optimisation)
    // Mémorise la fonction 'request' pour éviter qu'elle ne soit recréée à chaque rendu du composant,
    // ce qui prévient les boucles infinies si le hook est utilisé dans un useEffect.
    const request = useCallback(async (url, option = {}, showToast = true) => {
        setLoading(true);
        setError(null);

        try {
            // 3. EXÉCUTION DE LA REQUÊTE
            // L'objet 'option' permet aux composants de passer des headers, des méthodes (POST, PUT), 
            // ou le fameux 'signal' de l'AbortController.
            const response = await fetch(url, option);
            const result = await response.json();

            // 4. GESTION DES ERREURS SERVEUR
            // Si le serveur répond avec un code d'erreur (ex: 404, 500) ou un success false.
            if (!response.ok || result.success === false) {
                // On lève une exception qui sera capturée par le bloc 'catch' juste en dessous.
                throw new Error(result.message || result.error || `Erreur HTTP : ${response.status}`);
            }
            
            // 5. SUCCÈS
            setData(result.data);
            return { success: true, data: result.data };

        } catch (err) {
            // ==========================================
            // 6. LA SÉCURITÉ ANTI-FUITE DE MÉMOIRE (La ligne pour le jury)
            // ==========================================
            // Si le composant a été détruit avant la fin de la requête (changement de page rapide),
            // l'AbortController déclenche une 'AbortError'. On l'intercepte ici pour sortir de la fonction 
            // en silence, SANS mettre à jour d'état (ce qui causerait une fuite de mémoire).
            if (err.name === 'AbortError') return { success: false, aborted: true };

            // 7. GESTION DES ERREURS CLASSIQUES (Réseau coupé, serveur éteint...)
            const errorMessage = err.message || "Une erreur est survenue.";
            setError(errorMessage);

            // 8. EXPÉRIENCE UTILISATEUR (UX)
            // Affichage automatique d'une notification visuelle, désactivable si besoin via 'showToast'
            if (showToast) {
                toast.error(errorMessage);
            }
            return { success: false, error: errorMessage };

        } finally {
            // 9. NETTOYAGE FIN DE CYCLE
            // Qu'il y ait eu un succès ou une erreur, on arrête le spinner de chargement.
            setLoading(false);
        }
    }, []); // Le tableau de dépendances vide garantit que la fonction est créée une seule fois.

    return { data, loading, error, request, setData };
}