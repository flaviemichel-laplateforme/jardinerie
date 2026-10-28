import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';
import Spinner from '../ui/Spinner';
import DangerZone from '../ui/DangerZone';
import toast from 'react-hot-toast';
import { ORDER_STATUS_CONFIG } from '../../constants/orderStatus';
import AdminCardAction from './AdminCardAction';

const ROLE_LABELS = { customer: 'Client', admin: 'Administrateur' };
const ROLE_COLORS = {
  customer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
};

export default function AdminClientsTable({ clients }) {
  const navigate = useNavigate();
  const [viewingClientId, setViewingClientId] = useState(null);
  const { data: detailData, loading: detailLoading, request: detailRequest } = useApi();
  const { loading: roleLoading, request: roleRequest } = useApi();
  const { loading: resetLoading, request: resetRequest } = useApi();
  const { loading: anonymizeLoading, request: anonymizeRequest } = useApi();

  const handleViewDetails = (id) => {
    setViewingClientId(id);
    detailRequest(adminService.buildClientDetailUrl(id), buildRequestOptions());
  };

  const handleRoleChange = async (newRole) => {
    const result = await roleRequest(
      adminService.buildClientRoleUrl(viewingClientId),
      buildRequestOptions({ method: 'PATCH', body: { role: newRole } }),
      false
    );
    if (result.success) {
      toast.success('Rôle mis à jour avec succès.');
      detailRequest(adminService.buildClientDetailUrl(viewingClientId), buildRequestOptions());
    } else {
      toast.error(result.error || 'Une erreur est survenue.');
    }
  };

  const handlePasswordReset = async () => {
    const result = await resetRequest(
      adminService.buildClientPasswordResetUrl(viewingClientId),
      buildRequestOptions({ method: 'POST' }),
      false
    );
    if (result.success) {
      toast.success('Lien de réinitialisation envoyé au client.');
    } else {
      toast.error(result.error || 'Une erreur est survenue.');
    }
  };

  const handleAnonymize = async () => {
    const result = await anonymizeRequest(
      adminService.buildClientAnonymizeUrl(viewingClientId),
      buildRequestOptions({ method: 'POST' }),
      false
    );
    if (result.success) {
      toast.success('Le compte a été anonymisé.');
      setViewingClientId(null);
    } else {
      toast.error(result.error || 'Une erreur est survenue.');
    }
  };

  const client = detailData?.client;
  const addresses = detailData?.addresses ?? [];
  const orders = detailData?.orders ?? [];

  return (
    <>
      {/* Sous xl (1280 px) : une carte par compte */}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
        {clients.length === 0 ? (
          <li className="rounded-xl border border-gray-200 bg-white py-10 text-center italic text-gray-400 shadow-sm md:col-span-2">
            Aucun compte trouvé.
          </li>
        ) : (
          clients.map(c => (
            <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jardinerie-bg text-sm font-bold text-jardinerie-primary" aria-hidden="true">
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-jardinerie-text">{c.first_name} {c.last_name}</p>
                  <p className="truncate text-sm text-gray-500">{c.email}</p>
                </div>
                <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_COLORS[c.role]}`}>
                  {ROLE_LABELS[c.role] ?? c.role}
                </span>
              </div>
              <p className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <span>Commandes</span>
                <span className="font-bold text-jardinerie-text">{c.total_orders}</span>
              </p>
              <div className="mt-3 flex">
                <AdminCardAction onClick={() => handleViewDetails(c.id)}>Voir détails</AdminCardAction>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* xl et plus : le tableau (il a besoin d'environ 900 px de large, la barre latérale en prend jusqu'à 288) */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:block">
        <table className="w-full text-sm">
          <thead className="bg-jardinerie-bg border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Client</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Email</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Rôle</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Commandes</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-jardinerie-text uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 italic">Aucun compte trouvé.</td>
              </tr>
            ) : (
              clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jardinerie-bg text-xs font-bold text-jardinerie-primary">
                      {c.first_name?.[0]}{c.last_name?.[0]}
                    </span>
                    <span className="font-medium text-jardinerie-text">{c.first_name} {c.last_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_COLORS[c.role]}`}>
                      {ROLE_LABELS[c.role] ?? c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-jardinerie-text">{c.total_orders}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(c.id)}
                      className="rounded-lg bg-jardinerie-bg px-3 py-1.5 text-xs font-medium text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white transition-colors"
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingClientId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setViewingClientId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !client ? (
              <Spinner message="Chargement du détail..." />
            ) : (
              <>
                <h3 className="text-lg font-bold text-jardinerie-text mb-1">
                  {client.first_name} {client.last_name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{client.email}</p>

                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm font-medium text-jardinerie-text">Rôle :</label>
                  <select
                    value={client.role}
                    disabled={roleLoading}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-jardinerie-text disabled:opacity-50"
                  >
                    <option value="customer">Client</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <h4 className="text-xs font-bold text-jardinerie-text uppercase tracking-wide mt-4 mb-2">Adresses</h4>
                {addresses.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune adresse enregistrée.</p>
                ) : (
                  <ul className="space-y-2">
                    {addresses.map(a => (
                      <li key={a.id} className="text-sm text-gray-600">
                        {a.recipient_first_name} {a.recipient_last_name} — {a.street}, {a.postal_code} {a.city}
                      </li>
                    ))}
                  </ul>
                )}

                <h4 className="text-xs font-bold text-jardinerie-text uppercase tracking-wide mt-4 mb-2">Historique des commandes</h4>
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune commande.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/commandes?orderId=${o.id}`)}
                          className="w-full flex justify-between items-center py-2 text-sm hover:bg-gray-50 rounded transition-colors"
                        >
                          <span className="text-jardinerie-text underline decoration-dotted">{o.order_reference}</span>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${ORDER_STATUS_CONFIG[o.status]?.color}`}>
                            {ORDER_STATUS_CONFIG[o.status]?.label ?? o.status}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={resetLoading}
                    className="w-full rounded-full border border-jardinerie-primary text-jardinerie-primary py-2.5 text-sm font-medium hover:bg-jardinerie-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'Envoi...' : 'Envoyer un lien de réinitialisation'}
                  </button>

                  <DangerZone
                    title="Anonymiser ce compte"
                    description="Le nom, l'email et les informations personnelles du client seront définitivement effacés. L'historique de commandes sera conservé à des fins comptables."
                    buttonLabel="Anonymiser ce compte"
                    confirmTitle="Confirmer l'anonymisation"
                    confirmMessage="Êtes-vous sûre de vouloir anonymiser ce compte ? Cette action est irréversible."
                    confirmLabel="Oui, anonymiser"
                    onConfirm={handleAnonymize}
                    loading={anonymizeLoading}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setViewingClientId(null)}
                  className="mt-4 w-full rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
