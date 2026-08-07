import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { addressService } from '../../services/addressService';
import { buildRequestOptions } from '../../services/apiClient';

const emptyAddress = {
  recipient_first_name: '',
  recipient_last_name: '',
  street: '',
  postal_code: '',
  city: '',
  country: 'France',
  phone: '',
};

export default function AddressPicker({ addresses, selectedId, onSelect, onAddressSaved, onAddressDeleted }) {
  const [mode, setMode] = useState('list');
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState(emptyAddress);

  const { loading: saving, error, request } = useApi();

  const showForm = mode === 'form' || addresses.length === 0;

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData(emptyAddress);
    setMode('form');
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      recipient_first_name: address.recipient_first_name,
      recipient_last_name: address.recipient_last_name,
      street: address.street,
      postal_code: address.postal_code,
      city: address.city,
      country: address.country,
      phone: address.phone,
    });
    setMode('form');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = editingAddress
      ? addressService.buildUpdateUrl(editingAddress.id)
      : addressService.buildCreateUrl();
    const method = editingAddress ? 'PUT' : 'POST';

    const result = await request(url, buildRequestOptions({ method, body: formData }), false);

    if (result.success) {
      const savedId = editingAddress ? editingAddress.id : result.data.id;
      onAddressSaved({ ...formData, id: savedId });
      onSelect(savedId);
      setMode('list');
    }
  };

  const handleDelete = async (e, addressId) => {
    e.stopPropagation();

    const confirmed = window.confirm('Voulez-vous vraiment supprimer cette adresse ?');
    if (!confirmed) return;

    const result = await request(
      addressService.buildDeleteUrl(addressId),
      buildRequestOptions({ method: 'DELETE' }),
      false
    );

    if (result.success) {
      onAddressDeleted(addressId);
    }
  };

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 p-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            name="recipient_first_name"
            placeholder="Prénom"
            value={formData.recipient_first_name}
            onChange={handleChange}
            required
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
          />
          <input
            name="recipient_last_name"
            placeholder="Nom"
            value={formData.recipient_last_name}
            onChange={handleChange}
            required
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
          />
        </div>

        <input
          name="street"
          placeholder="Adresse"
          value={formData.street}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            name="postal_code"
            placeholder="Code postal"
            value={formData.postal_code}
            onChange={handleChange}
            required
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
          />
          <input
            name="city"
            placeholder="Ville"
            value={formData.city}
            onChange={handleChange}
            required
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
          />
        </div>

        <input
          name="phone"
          placeholder="Téléphone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
        />

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-jardinerie-primary py-2.5 text-sm font-bold text-white disabled:opacity-70"
          >
            {saving ? 'Enregistrement...' : 'Valider cette adresse'}
          </button>

          {addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('list')}
              className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          onClick={() => onSelect(addr.id)}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            selectedId === addr.id
              ? 'border-jardinerie-primary bg-jardinerie-primary/5 ring-1 ring-jardinerie-primary'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="font-bold text-jardinerie-text">
            {addr.recipient_first_name} {addr.recipient_last_name}
          </p>
          <p className="text-sm text-gray-600">{addr.street}</p>
          <p className="text-sm text-gray-600">{addr.postal_code} {addr.city}</p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(addr);
            }}
            className="mt-2 text-xs font-medium text-jardinerie-primary underline"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={(e) => handleDelete(e, addr.id)}
            className="ml-3 mt-2 inline-flex items-center text-xs font-medium text-red-500 hover:text-red-700"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddNew}
        className="w-full rounded-xl border border-dashed border-gray-300 p-4 text-sm font-medium text-gray-500 hover:border-jardinerie-primary hover:text-jardinerie-primary"
      >
        + Ajouter une nouvelle adresse
      </button>
    </div>
  );
}