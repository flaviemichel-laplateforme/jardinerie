import { useState, useEffect } from "react";

/**
 * Hook qui retarde la mise à jour d'une valeur jusqu'à ce que 
 * le délai (en ms) se soit écoulé depuis la dernière frappe.
 */
export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
    // On programme la mise à jour de la valeur
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si la valeur change avant la fin du délai (l'utilisateur tape une autre lettre), 
    // on annule le timeout précédent et on en relance un nouveau.
    return () => {
        clearTimeout(handler);
    };

}, [value, delay]);

return debouncedValue;

}