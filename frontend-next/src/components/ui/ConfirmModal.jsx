'use client';

import { useEffect, useRef } from 'react';

/**
 * Fenêtre de confirmation. Au clavier : Échap annule, le focus démarre sur « Annuler » (le choix prudent) et revient
 * sur le bouton qui a ouvert la fenêtre à la fermeture.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement;
    cancelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      opener?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmStyles = {
    danger: 'bg-red-600 text-white hover:bg-red-700',
    primary: 'bg-jardinerie-primary text-white hover:bg-green-700',
  };

  return (
    // Clic sur le fond = annulation
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="mb-2 text-lg font-bold text-jardinerie-text">{title}</h2>
        <p id="confirm-modal-message" className="mb-6 text-sm text-gray-600">{message}</p>

        <div className="flex gap-3">
          <button
            ref={cancelRef}
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
            className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-colors disabled:opacity-60 ${confirmStyles[variant]}`}
          >
            {loading ? 'En cours...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
