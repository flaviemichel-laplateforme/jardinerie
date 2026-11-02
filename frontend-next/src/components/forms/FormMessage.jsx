/** Message au-dessus du formulaire : erreur (rouge, annoncée tout de suite) ou information (verte). Rien ne s'affiche si vide. */
export default function FormMessage({ type = 'error', children }) {
    if (!children) return null;

    const isError = type === 'error';

    return (
        <div
            role={isError ? 'alert' : 'status'}
            className={`mb-6 rounded-lg border p-4 text-sm ${
                isError ? 'border-red-200 bg-red-50 text-red-600' : 'border-green-200 bg-green-50 text-green-800'
            }`}
        >
            {children}
        </div>
    );
}
