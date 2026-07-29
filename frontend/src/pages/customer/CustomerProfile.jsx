import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import { buildRequestOptions } from '../../services/apiClient';
import toast from 'react-hot-toast';
import { getPasswordRules } from '../../utils/passwordRules';

export default function CustomerProfile() {
  const { user, login } = useAuth();

  // user est garanti non-null ici : AuthContext bloque l'affichage
 // jusqu'à ce que la session soit vérifiée, et la route /compte
 // n'est accessible qu'aux utilisateurs connectés.
 const [profileForm, setProfileForm] = useState({
   first_name: user?.first_name ?? '',
   last_name:  user?.last_name  ?? '',
   email:      user?.email      ?? '',
 });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  const { loading: profileLoading, request: profileRequest } = useApi();
  const { loading: passwordLoading, request: passwordRequest } = useApi();

  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const result = await profileRequest(
      userService.buildProfileUrl(),
      buildRequestOptions({ method: 'PUT', body: profileForm }),
      false
    );

    if (result.success) {
      // Met à jour le contexte Auth → sidebar et header reflètent
      // immédiatement le nouveau prénom sans recharger la page
      login({ ...user, ...profileForm });
      toast.success('Profil mis à jour avec succès !');
    } else {
      toast.error(result.message ?? 'Une erreur est survenue.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validation côté front (première ligne de défense pour l'UX)
    // La validation réelle de sécurité est faite côté PHP
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    const passwordRules = getPasswordRules(passwordForm.new_password);
    const failedRule = passwordRules.find((rule) => !rule.valid);
    if (failedRule) {
      toast.error(`Mot de passe invalide : il manque "${failedRule.label}".`);
      return;
    }

    const result = await passwordRequest(
      userService.buildPasswordUrl(),
      buildRequestOptions({
        method: 'PUT',
        body: {
          current_password:     passwordForm.current_password,
          new_password:         passwordForm.new_password,
          confirm_new_password: passwordForm.confirm_new_password,
        },
      }),
      false
    );

    if (result.success) {
      toast.success('Mot de passe modifié avec succès !');
      setPasswordForm({
        current_password:     '',
        new_password:         '',
        confirm_new_password: '',
      });
    } else {
      toast.error(result.message ?? 'Mot de passe actuel incorrect.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-jardinerie-text">Mon profil</h1>

      {/* ── Informations personnelles ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-jardinerie-text mb-5">
          Informations personnelles
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                name="first_name"
                value={profileForm.first_name}
                onChange={handleProfileChange}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                name="last_name"
                value={profileForm.last_name}
                onChange={handleProfileChange}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            />
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-full bg-jardinerie-primary px-8 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </section>

      {/* ── Changer le mot de passe ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-jardinerie-text mb-5">
          Changer le mot de passe
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            />
            {passwordForm.new_password && (
              <ul className="mt-1 space-y-0.5 text-xs">
                {getPasswordRules(passwordForm.new_password).map((rule) => (
                  <li key={rule.label} className={rule.valid ? 'text-green-600' : 'text-gray-400'}>
                    {rule.valid ? '✓' : '○'} {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              name="confirm_new_password"
              value={passwordForm.confirm_new_password}
              onChange={handlePasswordChange}
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-full bg-jardinerie-primary px-8 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </section>
    </div>
  );
}