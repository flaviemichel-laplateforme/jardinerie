import { Suspense } from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import Spinner from '../../components/ui/Spinner';

// Pages de compte : jamais dans les moteurs de recherche (voir aussi robots.js).
export const metadata = {
  title: 'Inscription',
  robots: { index: false, follow: false },
};

// Le composant lit l'adresse de la page (useSearchParams) : Next.js demande de l'entourer de Suspense.
export default function Page() {
  return (
    <Suspense fallback={<Spinner message="" className="min-h-[300px]" />}>
      <RegisterForm />
    </Suspense>
  );
}
