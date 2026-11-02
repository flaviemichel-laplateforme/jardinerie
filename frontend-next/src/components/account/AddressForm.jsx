'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { accountService } from '../../services/accountService';
import { sendJson } from '../../services/requestJson';
import TextField from '../forms/TextField';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';

const EMPTY_ADDRESS = {
  recipient_first_name: '',
  recipient_last_name: '',
  street: '',
  postal_code: '',
  city: '',
  country: 'France',
  phone: '',
};

// Champs obligatoires pour l'API (le pays est facultatif) et leur libellé
const FIELDS = [
  { id: 'recipient_first_name', label: 'Prénom', autoComplete: 'given-name', required: true },
  { id: 'recipient_last_name', label: 'Nom', autoComplete: 'family-name', required: true },
  { id: 'street', label: 'Adresse', autoComplete: 'street-address', required: true },
  { id: 'postal_code', label: 'Code postal', autoComplete: 'postal-code', required: true },
  { id: 'city', label: 'Ville', autoComplete: 'address-level2', required: true },
  { id: 'country', label: 'Pays', autoComplete: 'country-name', required: false },
  { id: 'phone', label: 'Téléphone', autoComplete: 'tel', type: 'tel', required: true },
];

/**
 * Formulaire d'adresse (création ou modification), utilisé par « Mes adresses » et par l'étape de livraison de la commande.
 * `onSaved(id)` reçoit l'identifiant de l'adresse enregistrée : l'étape de livraison s'en sert pour la sélectionner aussitôt.
 */
export default function AddressForm({ address, onSaved, onCancel, canCancel = true }) {
  const editing = Boolean(address);

  const [form, setForm] = useState(
    editing ? Object.fromEntries(Object.keys(EMPTY_ADDRESS).map((key) => [key, address[key] ?? ''])) : EMPTY_ADDRESS
  );
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const fieldErrors = Object.fromEntries(
    FIELDS.map((field) => [field.id, field.required && form[field.id].trim() === '' ? 'Ce champ est obligatoire.' : null])
  );

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(Object.fromEntries(FIELDS.map((field) => [field.id, true])));
    if (Object.values(fieldErrors).some(Boolean)) return;

    setSubmitting(true);
    setServerError('');

    const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    const result = await sendJson(
      editing ? accountService.buildAddressUrl(address.id) : accountService.buildAddressesUrl(),
      { method: editing ? 'PUT' : 'POST', body }
    );

    setSubmitting(false);

    if (result.ok) {
      toast.success(editing ? 'Adresse modifiée.' : 'Adresse ajoutée.');
      onSaved(editing ? address.id : result.data?.id);
    } else {
      // Le serveur détaille parfois les champs en cause (liste `errors`)
      setServerError([result.message, ...result.errors].join(' '));
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-bold text-jardinerie-text">{editing ? "Modifier l'adresse" : 'Nouvelle adresse'}</h2>

      <FormMessage>{serverError}</FormMessage>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.id} className={field.id === 'street' ? 'sm:col-span-2' : ''}>
            <TextField
              id={field.id}
              label={field.label}
              type={field.type}
              autoComplete={field.autoComplete}
              value={form[field.id]}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched[field.id] ? fieldErrors[field.id] : null}
              required={field.required}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <div className="sm:flex-1">
          <SubmitButton loading={submitting} loadingLabel="Enregistrement...">
            {editing ? 'Enregistrer les modifications' : "Ajouter l'adresse"}
          </SubmitButton>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
