'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import { useAccountData } from '../../hooks/useAccountData';
import { useCheckoutState } from '../../hooks/useCheckoutState';
import { accountService } from '../../services/accountService';
import { LoadingState, ErrorState } from '../account/DataState';
import AddressForm from '../account/AddressForm';
import CheckoutStepper from './CheckoutStepper';

/** Liste d'adresses à choisir (boutons radio) : une seule est sélectionnée, les autres peuvent être modifiées. */
function AddressChoices({ legend, name, addresses, selectedId, onSelect, onEdit, onAdd }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-lg font-bold text-jardinerie-text">{legend}</legend>

      {addresses.map((address) => {
        const checked = address.id === selectedId;
        return (
          <div
            key={address.id}
            className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
              checked ? 'border-jardinerie-primary bg-jardinerie-primary/5 ring-1 ring-jardinerie-primary' : 'border-gray-200 bg-white'
            }`}
          >
            <input
              type="radio"
              id={`${name}-${address.id}`}
              name={name}
              checked={checked}
              onChange={() => onSelect(address.id)}
              className="mt-1 h-4 w-4 accent-jardinerie-primary"
            />
            <label htmlFor={`${name}-${address.id}`} className="flex-1 cursor-pointer text-sm text-gray-700">
              <span className="block font-bold text-jardinerie-text">
                {address.recipient_first_name} {address.recipient_last_name}
              </span>
              <span className="block">{address.street}</span>
              <span className="block">{address.postal_code} {address.city}, {address.country}</span>
              <span className="block">{address.phone}</span>
            </label>
            <button
              type="button"
              onClick={() => onEdit(address)}
              aria-label={`Modifier l'adresse de ${address.recipient_first_name} ${address.recipient_last_name}, ${address.street}`}
              className="text-xs font-medium text-jardinerie-primary underline"
            >
              Modifier
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded-xl border border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-jardinerie-primary hover:text-jardinerie-primary"
      >
        + Ajouter une nouvelle adresse
      </button>
    </fieldset>
  );
}

/**
 * Étape 2 de la commande : choix de l'adresse de livraison (et de facturation si elle est différente).
 * La connexion est exigée ici (voir commande/layout.jsx) : c'est le premier endroit où l'on a besoin d'un compte.
 */
export default function AddressStep() {
  const router = useRouter();
  const { cartItems, isCartLoaded } = useCart();
  const { state, isLoaded, update } = useCheckoutState();
  const { data, loading, error, reload } = useAccountData(accountService.buildAddressesUrl());

  // null = liste ; { for: 'shipping' | 'billing', address: objet | null } = formulaire d'ajout (address null) ou de modification
  const [form, setForm] = useState(null);

  // Rien à commander : retour au panier
  useEffect(() => {
    if (isCartLoaded && cartItems.length === 0) router.replace('/panier');
  }, [isCartLoaded, cartItems.length, router]);

  if (!isCartLoaded || !isLoaded || loading) return <LoadingState message="Chargement de vos adresses..." />;
  if (cartItems.length === 0) return <LoadingState message="Redirection vers votre panier..." />;
  if (error) return <ErrorState message={error} />;

  const addresses = data?.addresses ?? [];
  const ids = addresses.map((address) => address.id);

  // Sélection effective : le choix enregistré s'il existe encore (une adresse a pu être supprimée), sinon la plus récente
  const shippingId = ids.includes(state.shippingAddressId) ? state.shippingAddressId : (ids[0] ?? null);
  const billingId = state.sameAsShipping ? shippingId : (ids.includes(state.billingAddressId) ? state.billingAddressId : (ids[0] ?? null));

  const handleSaved = (savedId) => {
    // `form` est null quand le formulaire s'affiche parce que le client n'a encore AUCUNE adresse : c'est alors l'adresse de livraison
    const target = form?.for ?? 'shipping';
    if (savedId) {
      update(target === 'shipping' ? { shippingAddressId: savedId } : { billingAddressId: savedId });
    }
    setForm(null);
    reload();
  };

  const handleContinue = () => {
    update({ shippingAddressId: shippingId, billingAddressId: billingId });
    router.push('/commande/paiement');
  };

  const showForm = form !== null || addresses.length === 0;

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-8">
      <CheckoutStepper currentStep={2} />

      <h1 className="mb-6 text-2xl font-bold text-jardinerie-text">Adresse de livraison</h1>

      {showForm ? (
        <AddressForm
          address={form?.address ?? null}
          onSaved={handleSaved}
          onCancel={() => setForm(null)}
          // sans aucune adresse, impossible d'annuler : il en faut au moins une pour commander
          canCancel={addresses.length > 0}
        />
      ) : (
        <div className="space-y-8">
          <AddressChoices
            legend="Livrer à"
            name="shipping"
            addresses={addresses}
            selectedId={shippingId}
            onSelect={(id) => update({ shippingAddressId: id })}
            onEdit={(address) => setForm({ for: 'shipping', address })}
            onAdd={() => setForm({ for: 'shipping', address: null })}
          />

          <div className="flex items-center gap-2">
            <input
              id="same-as-shipping"
              type="checkbox"
              checked={state.sameAsShipping}
              onChange={(event) => update({ sameAsShipping: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 accent-jardinerie-primary"
            />
            <label htmlFor="same-as-shipping" className="text-sm text-gray-700">
              Utiliser la même adresse pour la facturation
            </label>
          </div>

          {!state.sameAsShipping && (
            <AddressChoices
              legend="Facturer à"
              name="billing"
              addresses={addresses}
              selectedId={billingId}
              onSelect={(id) => update({ billingAddressId: id })}
              onEdit={(address) => setForm({ for: 'billing', address })}
              onAdd={() => setForm({ for: 'billing', address: null })}
            />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => router.push('/panier')}
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              ← Retour au panier
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!shippingId || !billingId}
              className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuer vers le paiement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
