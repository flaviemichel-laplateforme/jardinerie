import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { buildRequestOptions } from '../../services/apiClient';
import { userService } from '../../services/userService';
import ConsentBadge from '../../components/account/ConsentBadge';
import DangerZone from '../../components/ui/DangerZone';
import toast from 'react-hot-toast';

export default function CustomerRgpd() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { loading, request } = useApi();

  const registrationDate = user?.registration_date
    ? new Date(user.registration_date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  const handleDeleteAccount = async () => {
    const result = await request(
      userService.buildDeleteUrl(),
      buildRequestOptions({ method: 'DELETE', body: { confirm: true } }),
      false
    );

    if (result.success) {
      await logout();
      toast.success('Votre compte a été supprimé. À bientôt !');
      navigate('/');
    } else {
      toast.error(result.message ?? 'Une erreur est survenue.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-jardinerie-text">
        Confidentialité & RGPD
      </h1>

      {/* ── Consentements ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-bold text-jardinerie-text">
          Mes consentements
        </h2>
        <ConsentBadge
          label="Conditions Générales de Vente acceptées"
          date={registrationDate}
        />
        <ConsentBadge
          label="Politique de confidentialité acceptée"
          date={registrationDate}
        />
      </section>

      {/* ── Données personnelles ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-jardinerie-text mb-4">
          Mes données personnelles
        </h2>
        <dl className="space-y-2 text-sm text-gray-600">
          {[
            { label: 'Prénom',        value: user?.first_name },
            { label: 'Nom',           value: user?.last_name },
            { label: 'Email',         value: user?.email },
            { label: 'Membre depuis', value: registrationDate },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <dt className="font-medium text-gray-700">{label}</dt>
              <dd>{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-gray-400">
          Pour modifier ces informations, rendez-vous dans{' '}
          <a href="/compte/parametres" className="text-jardinerie-primary underline">
            Mon profil
          </a>.
        </p>
      </section>

      {/* ── Droit à l'oubli ── */}
      <DangerZone
        title="Droit à l'oubli — Supprimer mon compte"
        description="Conformément au RGPD (Article 17), vous pouvez demander la suppression de vos données personnelles. Vos informations seront anonymisées immédiatement. Cette action est irréversible."
        warning="Note : l'historique de vos commandes sera conservé à des fins comptables légales, mais ne contiendra plus aucune donnée vous identifiant."
        buttonLabel="Supprimer mon compte"
        confirmTitle="Confirmer la suppression de votre compte"
        confirmMessage="Êtes-vous sûr(e) de vouloir supprimer votre compte ? Toutes vos données personnelles seront effacées immédiatement. Cette action est irréversible."
        confirmLabel="Oui, supprimer mon compte"
        onConfirm={handleDeleteAccount}
        loading={loading}
      />
    </div>
  );
}