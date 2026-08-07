import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { loading, request } = useApi();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await request(
      authService.buildRequestPasswordResetUrl(),
      buildRequestOptions({ method: 'POST', body: { email } }),
      false
    );

    if (result.success) {
      setSubmitted(true);
    } else {
      toast.error(result.error || "Une erreur est survenue.");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-jardinerie-text mb-4">Vérifiez vos emails</h1>
        <p className="text-gray-600">
          Si un compte existe avec l'adresse <strong>{email}</strong>, un email de réinitialisation vient de lui être envoyé.
        </p>
        <Link to="/connexion" className="text-jardinerie-primary underline mt-6 inline-block">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-jardinerie-text mb-2">Mot de passe oublié</h1>
      <p className="text-sm text-gray-500 mb-6">
        Indiquez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-jardinerie-primary py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-70"
        >
          {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
        </button>
      </form>
      <Link to="/connexion" className="text-jardinerie-primary underline mt-6 inline-block text-sm">
        Retour à la connexion
      </Link>
    </div>
  );
}
