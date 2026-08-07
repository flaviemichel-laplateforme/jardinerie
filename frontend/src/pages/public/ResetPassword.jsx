import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';
import toast from 'react-hot-toast';
import { getPasswordRules } from '../../utils/passwordRules';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { loading, request } = useApi();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    const passwordRules = getPasswordRules(newPassword);
    const failedRule = passwordRules.find((rule) => !rule.valid);
    if (failedRule) {
      toast.error(`Mot de passe invalide : il manque "${failedRule.label}".`);
      return;
    }

    const result = await request(
      authService.buildResetPasswordUrl(),
      buildRequestOptions({
        method: 'POST',
        body: { token, new_password: newPassword }
      }),
      false
    );

    if (result.success) {
      toast.success("Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.");
      navigate('/connexion');
    } else {
      toast.error(result.error || "Ce lien est invalide ou a expiré.");
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">
          Lien invalide. Merci de redemander un email de réinitialisation.
        </p>
        <Link to="/connexion" className="text-jardinerie-primary underline mt-4 inline-block">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-jardinerie-text mb-6">
        Choisissez un nouveau mot de passe
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-900">
            Nouveau mot de passe
          </label>
          <input
            id="new_password"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm"
          />
        </div>

        {newPassword && (
          <ul className="mt-1 space-y-0.5 text-xs">
            {getPasswordRules(newPassword).map((rule) => (
              <li key={rule.label} className={rule.valid ? 'text-green-600' : 'text-gray-400'}>
                {rule.valid ? '✓' : '○'} {rule.label}
              </li>
            ))}
          </ul>
        )}

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-900">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm_password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-jardinerie-primary py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-70"
        >
          {loading ? 'Enregistrement...' : 'Réinitialiser mon mot de passe'}
        </button>
      </form>
    </div>
  );
}
