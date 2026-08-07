import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { loading, request } = useApi();
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage("Lien invalide : aucun jeton de vérification trouvé.");
      return;
    }

    const verify = async () => {
      const result = await request(
        authService.buildVerifyEmailUrl(token),
        buildRequestOptions(),
        false
      );

      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || "Ce lien est invalide ou a expiré.");
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {loading && status === 'pending' && (
        <p className="text-gray-600">Vérification en cours...</p>
      )}

      {status === 'success' && (
        <>
          <p className="text-lg font-bold text-jardinerie-text mb-2">Email vérifié ! ✅</p>
          <p className="text-sm text-gray-600 mb-6">
            Votre compte est maintenant actif, vous pouvez vous connecter.
          </p>
          <Link to="/connexion" className="text-jardinerie-primary underline font-medium">
            Se connecter
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="text-lg font-bold text-red-600 mb-2">Lien invalide</p>
          <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
          <Link to="/connexion" className="text-jardinerie-primary underline font-medium">
            Retour à la connexion
          </Link>
        </>
      )}
    </div>
  );
}
