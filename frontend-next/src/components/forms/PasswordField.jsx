'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { inputClassName } from './fieldStyles';
import { PASSWORD_MAX_LENGTH } from '../../utils/validation';

/** Champ mot de passe avec un bouton pour afficher / masquer la saisie (utile surtout sur téléphone). */
export default function PasswordField({ id, label, error, hint, valid = false, ...inputProps }) {
    const [visible, setVisible] = useState(false);
    const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-gray-700">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={visible ? 'text' : 'password'}
                    maxLength={PASSWORD_MAX_LENGTH}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                    className={`${inputClassName({ error: !!error, valid })} pr-12`}
                    {...inputProps}
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-0 mt-1 flex w-12 items-center justify-center text-gray-500 hover:text-jardinerie-primary focus:outline-none focus-visible:text-jardinerie-primary"
                >
                    {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
            </div>
            {error && <p id={messageId} className="mt-1 text-xs text-red-600">{error}</p>}
            {!error && hint && <p id={messageId} className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}
