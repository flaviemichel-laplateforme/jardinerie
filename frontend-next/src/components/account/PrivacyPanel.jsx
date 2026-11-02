'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { accountService } from '../../services/accountService';
import { sendJson } from '../../services/requestJson';
import { formatDate } from '../../utils/format';
import ConfirmModal from '../ui/ConfirmModal';
import FormMessage from '../forms/FormMessage';

function ConsentBadge({ label, date }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-green-100 bg-green-50 p-4">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-green-800">{label}</p>
        <p className="mt-0.5 text-xs text-green-700">Accepté le {date}</p>
      </div>
    </div>
  );
}

export default function PrivacyPanel() {
  const { user, endSession } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const consentDate = user.gdpr_consent_key ? formatDate(user.gdpr_consent_key) : null;

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    const result = await sendJson(accountService.buildDeleteAccountUrl(), { method: 'DELETE', body: { confirm: true } });

    if (result.ok) {
      // Le compte est anonymisé et la session fermée : on recharge le site sur l'accueil
      await endSession('/');
      return;
    }

    setDeleting(false);
    setModalOpen(false);
    setError(result.message);
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-jardinerie-text">Confidentialité &amp; RGPD</h1>
        <p className="mt-1 text-sm text-gray-600">Votre confiance est le terreau de notre relation.</p>
      </div>

      <section aria-labelledby="rights-title" className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 id="rights-title" className="mb-4 text-lg font-bold text-jardinerie-text">Vos droits fondamentaux</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a href="#mes-donnees" className="rounded-lg border border-gray-100 p-4 transition-colors hover:border-jardinerie-primary">
            <Eye size={24} aria-hidden="true" className="text-jardinerie-primary" />
            <p className="mt-2 font-medium text-jardinerie-text">Accès</p>
            <p className="mt-1 text-xs text-gray-600">Consultez l&apos;intégralité de vos données personnelles ci-dessous.</p>
          </a>
          <Link href="/compte/parametres" className="rounded-lg border border-gray-100 p-4 transition-colors hover:border-jardinerie-primary">
            <Pencil size={24} aria-hidden="true" className="text-jardinerie-primary" />
            <p className="mt-2 font-medium text-jardinerie-text">Rectification</p>
            <p className="mt-1 text-xs text-gray-600">Modifiez vos informations à tout moment depuis votre profil.</p>
          </Link>
          <a href="#suppression-compte" className="rounded-lg border border-gray-100 p-4 transition-colors hover:border-jardinerie-primary">
            <Trash2 size={24} aria-hidden="true" className="text-jardinerie-primary" />
            <p className="mt-2 font-medium text-jardinerie-text">Droit à l&apos;oubli</p>
            <p className="mt-1 text-xs text-gray-600">Demandez la suppression définitive de votre compte en toute simplicité.</p>
          </a>
        </div>
      </section>

      <section aria-labelledby="consents-title" className="space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        <h2 id="consents-title" className="text-lg font-bold text-jardinerie-text">Mes consentements</h2>
        {consentDate ? (
          <>
            <ConsentBadge label="Conditions Générales de Vente acceptées" date={consentDate} />
            <ConsentBadge label="Politique de confidentialité acceptée" date={consentDate} />
          </>
        ) : (
          <p className="text-sm italic text-gray-500">Aucun consentement enregistré pour ce compte.</p>
        )}
      </section>

      <section id="mes-donnees" aria-labelledby="data-title" className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 id="data-title" className="mb-4 text-lg font-bold text-jardinerie-text">Mes données personnelles</h2>
        <dl className="space-y-2 text-sm text-gray-600">
          {[
            { label: 'Prénom', value: user.first_name },
            { label: 'Nom', value: user.last_name },
            { label: 'E-mail', value: user.email },
            { label: 'Membre depuis', value: formatDate(user.registration_date) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-gray-100 py-2 last:border-0">
              <dt className="font-medium text-gray-700">{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-gray-600">
          Pour modifier ces informations, rendez-vous dans{' '}
          <Link href="/compte/parametres" className="text-jardinerie-primary underline">Mon profil</Link>.
        </p>
      </section>

      <section id="suppression-compte" aria-labelledby="danger-title" className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 id="danger-title" className="mb-2 text-lg font-bold text-red-700">Droit à l&apos;oubli — Supprimer mon compte</h2>
        <p className="mb-3 text-sm text-red-700">
          Conformément au RGPD (article 17), vous pouvez demander la suppression de vos données personnelles. Vos informations
          seront anonymisées immédiatement. Cette action est irréversible.
        </p>
        <p className="mb-4 text-xs text-red-700">
          Vos adresses enregistrées seront supprimées. L&apos;historique de vos commandes est conservé à des fins comptables légales
          et continue d&apos;afficher l&apos;adresse de livraison et de facturation de l&apos;époque, mais n&apos;est plus rattaché à
          votre identité (nom, e-mail).
        </p>

        <FormMessage>{error}</FormMessage>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          Supprimer mon compte
        </button>
      </section>

      <ConfirmModal
        isOpen={modalOpen}
        title="Confirmer la suppression de votre compte"
        message="Êtes-vous sûr(e) de vouloir supprimer votre compte ? Toutes vos données personnelles seront effacées immédiatement. Cette action est irréversible."
        confirmLabel="Oui, supprimer mon compte"
        onConfirm={handleDelete}
        onCancel={() => setModalOpen(false)}
        loading={deleting}
      />
    </>
  );
}
