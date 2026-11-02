'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useAccountData } from '../../hooks/useAccountData';
import { accountService } from '../../services/accountService';
import { sendJson } from '../../services/requestJson';
import { LoadingState, ErrorState } from './DataState';
import AddressForm from './AddressForm';
import FormMessage from '../forms/FormMessage';
import ConfirmModal from '../ui/ConfirmModal';

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
