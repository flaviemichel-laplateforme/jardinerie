// Ces contrôles ne servent qu'à aider la personne qui remplit le formulaire. L'API refait TOUS les contrôles et reste l'autorité
// (liste de mots de passe courants, adresse e-mail dans le mot de passe...) : on affiche ses messages tels quels.

// Même expression que celle des navigateurs pour <input type="email"> (HTML Living Standard).
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Même règle que NamePolicy côté API : lettres (accents compris), apostrophes, tirets, espaces.
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ' -]+$/;

// bcrypt ne lit que les 72 premiers octets : l'API refuse au-delà.
export const PASSWORD_MAX_LENGTH = 72;

export function validateEmail(value) {
    const email = value.trim();
    if (email === '') return "L'adresse email est obligatoire.";
    if (!EMAIL_REGEX.test(email)) return 'Adresse email invalide.';
    return null;
}

export function validateName(value, label) {
    const name = value.trim();
    if (name === '') return `Le ${label} est obligatoire.`;
    if (!NAME_REGEX.test(name)) return 'Uniquement des lettres, espaces, apostrophes et tirets.';
    return null;
}

export function getPasswordRules(password) {
    return [
        { label: 'Au moins 8 caractères', valid: password.length >= 8 },
        { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
        { label: 'Une minuscule', valid: /[a-z]/.test(password) },
        { label: 'Un chiffre', valid: /[0-9]/.test(password) },
        { label: 'Un caractère spécial', valid: /[^A-Za-z0-9]/.test(password) },
    ];
}

/** « 898 » -> « 14 min 58 s », « 42 » -> « 42 s » : le délai d'attente affiché après un blocage (429). */
export function formatWait(seconds) {
    const total = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return minutes > 0 ? `${minutes} min ${String(rest).padStart(2, '0')} s` : `${rest} s`;
}
