import { buildRequestOptions } from './apiClient';

/**
 * Envoie une requête JSON à l'API et renvoie TOUJOURS un objet (ne lève jamais d'exception) :
 * { ok, status, message, data, errors, retryAfter }
 *
 * Pourquoi pas useApi : un formulaire a besoin du code HTTP (429 = trop de tentatives, 403 = adresse non vérifiée, 409...)
 * et du délai d'attente (`retry_after`), que useApi ne remonte pas.
 */
export async function sendJson(url, { method = 'POST', body, signal } = {}) {
    try {
        const response = await fetch(url, buildRequestOptions({ method, body, signal }));

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            // Réponse vide ou qui n'est pas du JSON (page d'erreur du serveur) : on garde payload à null
        }

        const ok = response.ok && payload?.success !== false;

        return {
            ok,
            status: response.status,
            message: payload?.message || (ok ? '' : `Erreur ${response.status}. Merci de réessayer.`),
            data: payload?.data ?? null,
            errors: Array.isArray(payload?.errors) ? payload.errors : [],
            retryAfter: Number(payload?.retry_after ?? response.headers.get('Retry-After') ?? 0) || 0,
        };
    } catch {
        return {
            ok: false,
            status: 0,
            message: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
            data: null,
            errors: [],
            retryAfter: 0,
        };
    }
}
