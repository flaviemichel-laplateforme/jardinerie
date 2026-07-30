import { useNavigate, Link } from 'react-router-dom';
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

  const consentDate = user?.gdpr_consent_key
    ? new Date(user.gdpr_consent_key).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

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
      <p className="text-sm text-gray-500 -mt-4">
        Votre confiance est le terreau de notre relation.
      </p>

      {/* ── Vos droits fondamentaux ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-jardinerie-text mb-4">
          Vos droits fondamentaux
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="#mes-donnees" className="rounded-lg border border-gray-100 p-4 hover:border-jardinerie-primary transition-colors">
            <span className="text-2xl">👁️</span>
            <p className="font-medium text-jardinerie-text mt-2">Accès</p>
            <p className="text-xs text-gray-500 mt-1">
              Consultez l'intégralité de vos données personnelles ci-dessous.
            </p>
          </a>
          <Link to="/compte/parametres" className="rounded-lg border border-gray-100 p-4 hover:border-jardinerie-primary transition-colors">
            <span className="text-2xl">✏️</span>
            <p className="font-medium text-jardinerie-text mt-2">Rectification</p>
            <p className="text-xs text-gray-500 mt-1">
              Modifiez vos informations à tout moment depuis votre profil.
            </p>
          </Link>
          <a href="#suppression-compte" className="rounded-lg border border-gray-100 p-4 hover:border-jardinerie-primary transition-colors">
            <span className="text-2xl">🗑️</span>
            <p className="font-medium text-jardinerie-text mt-2">Droit à l'oubli</p>
            <p className="text-xs text-gray-500 mt-1">
              Demandez la suppression définitive de votre compte en toute simplicité.
            </p>
          </a>
        </div>
      </section>

      {/* ── Consentements ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-bold text-jardinerie-text">
          Mes consentements
        </h2>
        {consentDate ? (
          <>
            <ConsentBadge
              label="Conditions Générales de Vente acceptées"
              date={consentDate}
            />
            <ConsentBadge
              label="Politique de confidentialité acceptée"
              date={consentDate}
            />
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Aucun consentement enregistré pour ce compte.
          </p>
        )}
      </section>

      {/* ── Données personnelles ── */}
      <section id="mes-donnees" className="rounded-xl border border-gray-200 bg-white p-6">
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
          <Link to="/compte/parametres" className="text-jardinerie-primary underline">
            Mon profil
          </Link>.
        </p>
      </section>

      {/* ── Droit à l'oubli ── */}
      <div id="suppression-compte">
      <DangerZone
        title="Droit à l'oubli — Supprimer mon compte"
        description="Conformément au RGPD (Article 17), vous pouvez demander la suppression de vos données personnelles. Vos informations seront anonymisées immédiatement. Cette action est irréversible."
        warning="Note : vos adresses enregistrées seront supprimées. L'historique de vos commandes sera conservé à des fins comptables légales et continuera d'afficher l'adresse de livraison/facturation telle qu'elle était au moment de l'achat, mais ne sera plus rattaché à votre identité (nom, email)."
        buttonLabel="Supprimer mon compte"
        confirmTitle="Confirmer la suppression de votre compte"
        confirmMessage="Êtes-vous sûr(e) de vouloir supprimer votre compte ? Toutes vos données personnelles seront effacées immédiatement. Cette action est irréversible."
        confirmLabel="Oui, supprimer mon compte"
        onConfirm={handleDeleteAccount}
        loading={loading}
      />
      </div>
    </div>
  );
}
