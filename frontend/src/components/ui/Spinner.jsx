export default function Spinner({
  message = 'Chargement en cours...',
  size = 'md',
  className = '',
}) {
  const sizeMap = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4',
  };

  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-[400px] flex-col items-center justify-center space-y-4 ${className}`}
    >
      {/* Le cercle animé (respecte prefers-reduced-motion) */}
      <div
        className={`${sizeClass} motion-safe:animate-spin rounded-full border-jardinerie-bg border-t-jardinerie-primary`}
        aria-hidden="true"
      />

      {/* Le texte optionnel (annonce déjà via role/status) */}
      {message && (
        <p className="motion-safe:animate-pulse text-sm font-medium text-jardinerie-text">
          {message}
        </p>
      )}
    </div>
  );
}