'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useFormRequest } from '../../hooks/useFormRequest';
import { accountService } from '../../services/accountService';
import { validateEmail, validateName, getPasswordRules, formatWait } from '../../utils/validation';
import TextField from '../forms/TextField';
import PasswordField from '../forms/PasswordField';
import PasswordRules from '../forms/PasswordRules';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';

function ProfileForm() {
  const { user, login } = useAuth();
  const { send, submitting, error, secondsLeft } = useFormRequest();

  const [form, setForm] = useState({
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    current_password: '',
  });
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState('');

  // Changer d'adresse prend le contrôle du compte : l'API exige alors le mot de passe actuel
  const emailChanged = form.email.trim().toLowerCase() !== (user.email ?? '').toLowerCase();

  const fieldErrors = {
    first_name: validateName(form.first_name, 'prénom'),
    last_name: validateName(form.last_name, 'nom'),
    email: validateEmail(form.email),
    current_password: emailChanged && form.current_password === '' ? 'Le mot de passe actuel est requis pour changer d\'adresse.' : null,
  };

  const handleChange = (event) => {
    setSuccess('');
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };
  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ first_name: true, last_name: true, email: true, current_password: true });
    if (Object.values(fieldErrors).some(Boolean)) return;

    const body = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      ...(emailChanged && { current_password: form.current_password }),
    };

    const result = await send(accountService.buildProfileUrl(), body, 'PUT');
    if (!result.ok) return;

    // Les noms changent tout de suite ; l'adresse, elle, ne change qu'après le clic dans le lien envoyé à la NOUVELLE adresse.
    // On garde donc l'ancienne adresse à l'écran et dans la session.
    login({ ...user, first_name: body.first_name, last_name: body.last_name });
    setForm((previous) => ({ ...previous, email: user.email, current_password: '' }));
    setTouched({});
    setSuccess(result.message);
    toast.success('Profil mis à jour.');
  };

  const waiting = secondsLeft > 0;

  return (
    <section aria-labelledby="profile-title" className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 id="profile-title" className="mb-5 text-lg font-bold text-jardinerie-text">Informations personnelles</h2>

      <FormMessage>{error}</FormMessage>
      <FormMessage type="success">{success}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="first_name" label="Prénom" autoComplete="given-name" value={form.first_name}
            onChange={handleChange} onBlur={handleBlur} error={touched.first_name ? fieldErrors.first_name : null} required
          />
          <TextField
            id="last_name" label="Nom" autoComplete="family-name" value={form.last_name}
            onChange={handleChange} onBlur={handleBlur} error={touched.last_name ? fieldErrors.last_name : null} required
          />
        </div>

        <TextField
          id="email" label="Adresse e-mail" type="email" autoComplete="email" value={form.email}
          onChange={handleChange} onBlur={handleBlur} error={touched.email ? fieldErrors.email : null}
          hint="Un lien de confirmation sera envoyé à la nouvelle adresse : elle ne change qu'après votre clic."
          required
        />

        {emailChanged && (
          <PasswordField
            id="current_password" label="Mot de passe actuel" autoComplete="current-password"
            value={form.current_password} onChange={handleChange} onBlur={handleBlur}
            error={touched.current_password ? fieldErrors.current_password : null}
            hint="Demandé pour confirmer que c'est bien vous qui changez d'adresse."
            required
          />
        )}

        <div className="sm:max-w-xs">
          <SubmitButton loading={submitting} loadingLabel="Enregistrement..." disabled={waiting}>
            {waiting ? `Réessayer dans ${formatWait(secondsLeft)}` : 'Enregistrer les modifications'}
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { endSession } = useAuth();
  const { send, submitting, error, secondsLeft } = useFormRequest();

  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' });
  const [touched, setTouched] = useState({});

  const failedRule = getPasswordRules(form.new_password).find((rule) => !rule.valid);
  const fieldErrors = {
    current_password: form.current_password === '' ? 'Le mot de passe actuel est obligatoire.' : null,
    new_password: failedRule ? `Il manque : ${failedRule.label.toLowerCase()}.` : null,
    confirm_new_password: form.confirm_new_password !== form.new_password ? 'Les mots de passe ne correspondent pas.' : null,
  };

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ current_password: true, new_password: true, confirm_new_password: true });
    if (Object.values(fieldErrors).some(Boolean)) return;

    const result = await send(accountService.buildPasswordUrl(), form, 'PUT');
    if (!result.ok) return;

    // L'API ferme TOUTES les sessions au changement de mot de passe, y compris celle-ci : on le dit et on renvoie vers la connexion.
    await endSession('/connexion?motif=mot-de-passe-modifie');
  };

  const waiting = secondsLeft > 0;

  return (
    <section aria-labelledby="password-title" className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 id="password-title" className="mb-1 text-lg font-bold text-jardinerie-text">Changer le mot de passe</h2>
      <p className="mb-5 text-sm text-gray-600">Par sécurité, vous serez déconnecté(e) de tous vos appareils et devrez vous reconnecter.</p>

      <FormMessage>{error}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* id différent de celui du formulaire du profil (une page ne doit pas avoir deux id identiques), name identique à la clé */}
        <PasswordField
          id="password_current" name="current_password" label="Mot de passe actuel" autoComplete="current-password" value={form.current_password}
          onChange={handleChange} onBlur={handleBlur} error={touched.current_password ? fieldErrors.current_password : null} required
        />

        <div>
          <PasswordField
            id="new_password" label="Nouveau mot de passe" autoComplete="new-password" value={form.new_password}
            onChange={handleChange} onBlur={handleBlur} error={touched.new_password ? fieldErrors.new_password : null} required
          />
          <PasswordRules password={form.new_password} />
        </div>

        <PasswordField
          id="confirm_new_password" label="Confirmer le nouveau mot de passe" autoComplete="new-password" value={form.confirm_new_password}
          onChange={handleChange} onBlur={handleBlur} error={touched.confirm_new_password ? fieldErrors.confirm_new_password : null} required
        />

        <div className="sm:max-w-xs">
          <SubmitButton loading={submitting} loadingLabel="Modification..." disabled={waiting}>
            {waiting ? `Réessayer dans ${formatWait(secondsLeft)}` : 'Modifier le mot de passe'}
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

export default function ProfileSettings() {
  return (
    <>
      <h1 className="text-2xl font-bold text-jardinerie-text">Mon profil</h1>
      <ProfileForm />
      <PasswordForm />
    </>
  );
}
