import { getPasswordRules } from '../../utils/validation';

/** Liste des règles du mot de passe qui se coche pendant la saisie. Simple aide : c'est l'API qui valide pour de bon. */
export default function PasswordRules({ password }) {
    if (!password) return null;

    return (
        <ul className="mt-2 space-y-0.5 text-xs" aria-label="Règles du mot de passe">
            {getPasswordRules(password).map((rule) => (
                <li key={rule.label} className={rule.valid ? 'text-green-600' : 'text-gray-500'}>
                    <span aria-hidden="true">{rule.valid ? '✓' : '○'}</span> {rule.label}
                    <span className="sr-only">{rule.valid ? ' (respecté)' : ' (manquant)'}</span>
                </li>
            ))}
        </ul>
    );
}
