/**
 * Badge de consentement avec icône de validation.
 * Affiche un consentement accepté avec sa date.
 */
export default function ConsentBadge({ label, date }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
        <svg
          className="h-3 w-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-green-800">{label}</p>
        {date && (
          <p className="text-xs text-green-600 mt-0.5">Accepté le {date}</p>
        )}
      </div>
    </div>
  );
}