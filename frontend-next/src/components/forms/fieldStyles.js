// Aspect commun des champs : bordure grise, verte quand le champ est valide après avoir été quitté, rouge en cas d'erreur.
export function inputClassName({ error = false, valid = false } = {}) {
    const base = 'mt-1 block w-full rounded-lg border bg-white p-3 text-sm focus:outline-none focus:ring-1 transition-colors';
    if (error) return `${base} border-red-400 focus:border-red-400 focus:ring-red-400`;
    if (valid) return `${base} border-green-500 focus:border-green-500 focus:ring-green-500`;
    return `${base} border-gray-300 focus:border-jardinerie-primary focus:ring-jardinerie-primary`;
}
