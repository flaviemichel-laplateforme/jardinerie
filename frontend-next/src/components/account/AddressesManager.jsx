'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useAccountData } from '../../hooks/useAccountData';
import { accountService } from '../../services/accountService';
import { sendJson } from '../../services/requestJson';
import { LoadingState, ErrorState } from './DataState';
import TextField from '../forms/TextField';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';
import ConfirmModal from '../ui/ConfirmModal';

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

function AddressForm({ address, onSaved, onCancel }) {
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
      onSaved();
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
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function AddressesManager() {
  const { data, loading, error, reload } = useAccountData(accountService.buildAddressesUrl());

  // null = liste ; 'new' = formulaire d'ajout ; un objet adresse = formulaire de modification
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (loading) return <LoadingState message="Chargement de vos adresses..." />;
  if (error) return <ErrorState message={error} />;

  const addresses = data?.addresses ?? [];

  const handleSaved = () => {
    setEditing(null);
    reload();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');

    const result = await sendJson(accountService.buildAddressUrl(toDelete.id), { method: 'DELETE' });

    setDeleting(false);
    setToDelete(null);

    if (result.ok) {
      toast.success('Adresse supprimée.');
      reload();
    } else {
      // Ex. 409 : adresse liée à une commande existante, elle ne peut pas être supprimée
      setDeleteError(result.message);
    }
  };

  if (editing) {
    return (
      <>
        <h1 className="text-2xl font-bold text-jardinerie-text">Mes adresses</h1>
        <AddressForm address={editing === 'new' ? null : editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-jardinerie-text">Mes adresses</h1>

      <FormMessage>{deleteError}</FormMessage>

      {addresses.length === 0 ? (
        <p className="rounded-xl border border-jardinerie-primary/20 bg-jardinerie-bg p-8 text-center text-jardinerie-text/70">
          Vous n&apos;avez pas encore d&apos;adresse enregistrée.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="font-bold text-jardinerie-text">
                {address.recipient_first_name} {address.recipient_last_name}
              </p>
              <p className="text-sm text-gray-600">{address.street}</p>
              <p className="text-sm text-gray-600">{address.postal_code} {address.city}</p>
              <p className="text-sm text-gray-600">{address.country}</p>
              <p className="text-sm text-gray-600">{address.phone}</p>

              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditing(address)}
                  aria-label={`Modifier l'adresse de ${address.recipient_first_name} ${address.recipient_last_name}, ${address.street}`}
                  className="text-xs font-medium text-jardinerie-primary underline"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteError(''); setToDelete(address); }}
                  aria-label={`Supprimer l'adresse de ${address.recipient_first_name} ${address.recipient_last_name}, ${address.street}`}
                  className="inline-flex items-center text-xs font-medium text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setEditing('new')}
        className="w-full rounded-xl border border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-jardinerie-primary hover:text-jardinerie-primary"
      >
        + Ajouter une nouvelle adresse
      </button>

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        title="Supprimer cette adresse ?"
        message={toDelete ? `${toDelete.street}, ${toDelete.postal_code} ${toDelete.city}` : ''}
        confirmLabel="Oui, supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </>
  );
}
