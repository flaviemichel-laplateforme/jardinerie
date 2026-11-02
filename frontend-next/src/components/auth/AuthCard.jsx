/** Carte centrée qui contient chaque formulaire / écran de compte (titre de page = h1 pour les lecteurs d'écran). */
export default function AuthCard({ title, children }) {
    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center py-6">
            <div className="w-full rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="mb-6 text-center text-3xl font-extrabold text-jardinerie-text">{title}</h1>
                {children}
            </div>
        </div>
    );
}
