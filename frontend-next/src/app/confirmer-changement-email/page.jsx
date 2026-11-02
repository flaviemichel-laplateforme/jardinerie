import { Suspense } from 'react';
import TokenConfirmation from '../../components/auth/TokenConfirmation';
import { authService } from '../../services/authService';
import Spinner from '../../components/ui/Spinner';

export const metadata = {
  title: "Confirmation du changement d'adresse e-mail",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<Spinner message="" className="min-h-[300px]" />}>
      <TokenConfirmation
        url={authService.buildConfirmEmailChangeUrl()}
        successTitle="Adresse modifiée"
        successText="Votre adresse e-mail a bien été modifiée. Par sécurité, vous avez été déconnecté(e) partout : reconnectez-vous avec votre nouvelle adresse."
        closeSession
      />
    </Suspense>
  );
}
