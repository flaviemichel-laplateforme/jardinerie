import { inputClassName } from './fieldStyles';

/**
 * Champ de saisie avec son libellé. `error` n'est à renseigner qu'une fois le champ quitté (c'est le formulaire qui décide) ;
 * le lecteur d'écran annonce le message grâce à aria-describedby.
 */
export default function TextField({ id, label, error, hint, valid = false, ...inputProps }) {
    const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-gray-700">{label}</label>
            <input
                id={id}
                name={id}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={messageId}
                className={inputClassName({ error: !!error, valid })}
                {...inputProps}
            />
            {error && <p id={messageId} className="mt-1 text-xs text-red-600">{error}</p>}
            {!error && hint && <p id={messageId} className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}
