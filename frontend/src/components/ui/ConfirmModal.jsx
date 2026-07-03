import { useEffect } from 'react';

/**
 * Modale de confirmation générique.
 * Gère le focus trap et la fermeture avec Escape.
 *
 * @param {boolean} isOpen - Contrôle l'affichage
 * @param {string} title - Titre de la modale
 * @param {string} message - Corps du message
 * @param {string} confirmLabel - Texte du bouton de confirmation
 * @param {string} cancelLabel - Texte du bouton d'annulation
 * @param {function} onConfirm - Callback de confirmation
 * @param {function} onCancel - Callback d'annulation
 * @param {boolean} loading - Désactive le bouton pendant l'opération
 * @param {'danger'|'primary'} variant - Style du bouton de confirmation
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  onConfirm,
  onCancel,
  loading  = false,
  variant  = 'danger',
}) {
  // Fermeture avec la touche Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmStyles = {
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    primary: 'bg-jardinerie-primary hover:bg-green-700 text-white',
  };

  return (
    // Overlay — clic en dehors = annulation
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Panneau — stopPropagation pour ne pas fermer en cliquant dedans */}
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="modal-title"
          className="text-lg font-bold text-jardinerie-text mb-2"
        >
          {title}
        </h3>

        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-full py-2.5 text-sm font-bold disabled:opacity-60 transition-colors ${confirmStyles[variant]}`}
          >
            {loading ? 'En cours...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}