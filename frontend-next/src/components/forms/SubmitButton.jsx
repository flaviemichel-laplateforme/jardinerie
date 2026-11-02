/** Bouton d'envoi : désactivé pendant l'envoi (évite le double clic) ou pendant l'attente imposée après un blocage. */
export default function SubmitButton({ loading = false, loadingLabel = 'Envoi en cours...', disabled = false, children }) {
    return (
        <button
            type="submit"
            disabled={loading || disabled}
            className="w-full rounded-full bg-jardinerie-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-jardinerie-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {loading ? loadingLabel : children}
        </button>
    );
}
