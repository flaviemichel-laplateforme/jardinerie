import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

/**
 * Zone d'action destructive avec confirmation obligatoire.
 * Encapsule le bouton danger + la modale — le parent ne gère que le callback.
 */
export default function DangerZone({
  title,
  description,
  warning,
  buttonLabel   = 'Supprimer',
  confirmTitle,
  confirmMessage,
  confirmLabel  = 'Confirmer la suppression',
  onConfirm,
  loading = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setIsModalOpen(false);
  };

  return (
    <>
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-700 mb-2">{title}</h2>

        <p className="text-sm text-red-600 mb-3">{description}</p>

        {warning && (
          <p className="text-xs text-red-500 mb-4">{warning}</p>
        )}

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
        >
          {buttonLabel}
        </button>
      </section>

      <ConfirmModal
        isOpen={isModalOpen}
        title={confirmTitle ?? title}
        message={confirmMessage ?? description}
        confirmLabel={confirmLabel}
        onConfirm={handleConfirm}
        onCancel={() => setIsModalOpen(false)}
        loading={loading}
        variant="danger"
      />
    </>
  );
}