import RequireAuth from '../../components/account/RequireAuth';

// Tunnel de commande : jamais dans les moteurs de recherche. La connexion est exigée dès l'étape de livraison (choix de l'adresse) :
// sans session, on renvoie vers /connexion avec retour automatique ici. Le panier (/panier), lui, reste ouvert à tous.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function CommandeLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
