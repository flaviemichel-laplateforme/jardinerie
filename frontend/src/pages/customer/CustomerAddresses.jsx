import { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { addressService } from '../../services/addressService';
import { buildRequestOptions } from '../../services/apiClient';
import AddressPicker from '../../components/checkout/AddressPicker';

export default function CustomerAddresses() {
  const { data: addressData, request, setData } = useApi();
  const addresses = addressData?.addresses ?? [];

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
      const prevList = prev?.addresses ?? [];
      const exists = prevList.some((a) => a.id === savedAddress.id);
      return {
        ...prev,
        addresses: exists
          ? prevList.map((a) => (a.id === savedAddress.id ? savedAddress : a))
          : [savedAddress, ...prevList],
      };
    });
  };

  const handleAddressDeleted = (deletedId) => {
    setData((prev) => ({
      ...prev,
      addresses: (prev?.addresses ?? []).filter((a) => a.id !== deletedId),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-jardinerie-text mb-6">Mes adresses</h1>

      <AddressPicker
        addresses={addresses}
        selectedId={null}
        onSelect={() => {}}
        onAddressSaved={handleAddressSaved}
        onAddressDeleted={handleAddressDeleted}
      />
    </div>
  );
}