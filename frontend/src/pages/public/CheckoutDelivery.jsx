import { useState, useEffect } from 'react';
import { addressService } from '../../services/addressService';
import { useApi } from '../../hooks/useApi';
import AddressPicker from '../../components/checkout/AddressPicker';
import { buildRequestOptions } from '../../services/apiClient';

export default function CheckoutDelivery() {
  const { data: addressData, request, setData } = useApi();

  // Donnée DÉRIVÉE : pas de useState séparé, pas de useEffect de synchronisation.
  const addresses = addressData?.addresses ?? [];

  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddressId, setBillingAddressId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    request(
      addressService.buildListUrl(),
      buildRequestOptions({ signal: controller.signal }),
      false
    );
    return () => controller.abort();
  }, [request]);

  const handleAddressSaved = (savedAddress) => {
    setData((prev) => {
      const prevAddresses = prev?.addresses ?? [];
      const exists = prevAddresses.some((a) => a.id === savedAddress.id);
      const updatedAddresses = exists
        ? prevAddresses.map((a) => (a.id === savedAddress.id ? savedAddress : a))
        : [savedAddress, ...prevAddresses];
      return { ...prev, addresses: updatedAddresses };
    });
  };

  const handleAddressDeleted = (deletedId) => {
    setData((prev) => ({
      ...prev,
      addresses: (prev?.addresses ?? []).filter((a) => a.id !== deletedId),
    }));
    if (shippingAddressId === deletedId) setShippingAddressId(null);
    if (billingAddressId === deletedId) setBillingAddressId(null);
  };

  const effectiveBillingId = billingSameAsShipping ? shippingAddressId : billingAddressId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="mb-4 text-lg font-bold text-jardinerie-text">Adresse de livraison</h2>
      <AddressPicker
        addresses={addresses}
        selectedId={shippingAddressId}
        onSelect={setShippingAddressId}
        onAddressSaved={handleAddressSaved}
        onAddressDeleted={handleAddressDeleted}
      />

      <label className="mt-6 flex items-center gap-3">
        <input
          type="checkbox"
          checked={billingSameAsShipping}
          onChange={(e) => setBillingSameAsShipping(e.target.checked)}
        />
        <span className="text-sm text-jardinerie-text">
          Utiliser la même adresse pour la facturation
        </span>
      </label>

      {!billingSameAsShipping && (
        <>
          <h2 className="mb-4 mt-6 text-lg font-bold text-jardinerie-text">Adresse de facturation</h2>
          <AddressPicker
            addresses={addresses}
            selectedId={billingAddressId}
            onSelect={setBillingAddressId}
            onAddressSaved={handleAddressSaved}
            onAddressDeleted={handleAddressDeleted}
          />
        </>
      )}

      <button
        type="button"
        disabled={!shippingAddressId || !effectiveBillingId}
        className="mt-8 w-full rounded-full bg-jardinerie-primary py-3.5 text-sm font-bold text-white disabled:opacity-40"
      >
        Valider les modifications
      </button>
    </div>
  );
}