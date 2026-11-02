import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'jardinerie_checkout';
const DEFAULT_STATE = { shippingAddressId: null, billingAddressId: null, sameAsShipping: true };

/**
 * Choix faits pendant la commande (adresse de livraison, adresse de facturation, « même adresse »), gardés dans sessionStorage :
 * un rechargement de page ne casse plus le tunnel, et ils disparaissent à la fermeture de l'onglet.
 * On n'y met JAMAIS le secret de paiement (clientSecret) : la page de paiement crée une nouvelle intention à chaque ouverture.
 *
 * Comme pour le panier, l'état démarre « par défaut » puis se remplit après l'affichage (le serveur n'a pas de sessionStorage) :
 * `isLoaded` indique que la lecture est faite.
 */
export function useCheckoutState() {
    const [state, setState] = useState(DEFAULT_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            // Lecture unique d'un stockage extérieur à React, au montage : c'est l'usage prévu d'un effet.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
        } catch {
            // stockage bloqué ou contenu illisible : on repart des valeurs par défaut
        }
        setIsLoaded(true);
    }, []);

    // Sauvegarde à chaque changement, mais seulement APRÈS la lecture (sinon l'état par défaut écraserait l'état enregistré)
    useEffect(() => {
        if (!isLoaded) return;
        try {
            // Aucun choix fait (valeurs par défaut) : rien à garder. Sans cela, effacer l'état le réécrirait aussitôt.
            const isDefault = state.shippingAddressId === null && state.billingAddressId === null && state.sameAsShipping === true;
            if (isDefault) sessionStorage.removeItem(STORAGE_KEY);
            else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // stockage indisponible : le tunnel fonctionne, il ne survivra juste pas à un rechargement
        }
    }, [state, isLoaded]);

    const update = useCallback((partial) => setState((previous) => ({ ...previous, ...partial })), []);

    const clear = useCallback(() => {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            // rien à faire
        }
        setState(DEFAULT_STATE);
    }, []);

    return { state, isLoaded, update, clear };
}
