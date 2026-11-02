import AccountSidebar from './AccountSidebar';

/** Mise en page de l'espace client : navigation à gauche (ou barre du bas sur mobile) et contenu de la page à droite. */
export default function AccountShell({ children }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6">
      <AccountSidebar />
      <div className="min-w-0 flex-1 space-y-6">{children}</div>
    </div>
  );
}
