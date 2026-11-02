'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useFormRequest } from '../../hooks/useFormRequest';
import { authService } from '../../services/authService';
import { validateEmail, validateName, getPasswordRules, formatWait } from '../../utils/validation';
import AuthCard from './AuthCard';
import TextField from '../forms/TextField';
import PasswordField from '../forms/PasswordField';
import PasswordRules from '../forms/PasswordRules';
import Checkbox from '../forms/Checkbox';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';

const EMPTY_FORM = { first_name: '', last_name: '', email: '', password: '', confirm_password: '', gdpr_consent: false };

export default function RegisterForm() {
  const { send, submitting, error, secondsLeft } = useFormRequest();

  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [registeredEmail, setRegisteredEmail] = useState(null);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));

  const failedPasswordRule = getPasswordRules(form.password).find((rule) => !rule.valid);

  const fieldErrors = {
    first_name: validateName(form.first_name, 'prénom'),
    last_name: validateName(form.last_name, 'nom'),
    email: validateEmail(form.email),
    password: failedPasswordRule ? `Il manque : ${failedPasswordRule.label.toLowerCase()}.` : null,
    confirm_password: form.confirm_password !== form.password ? 'Les mots de passe ne correspondent pas.' : null,
    gdpr_consent: form.gdpr_consent ? null : 'Vous devez accepter les conditions pour créer un compte.',
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ first_name: true, last_name: true, email: true, password: true, confirm_password: true, gdpr_consent: true });

    if (Object.values(fieldErrors).some(Boolean)) {
      toast.error('Merci de corriger les champs invalides.');
      return;
    }

    const result = await send(authService.buildRegisterUrl(), {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      password: form.password,
      gdpr_consent: form.gdpr_consent,
    });

    if (result.ok) setRegisteredEmail(form.email.trim());
  };

  // L'API répond la même chose que l'adresse soit déjà inscrite ou non (pour ne pas révéler qui a un compte) :
  // on affiche donc toujours cet écran, sans connecter la personne.
  if (registeredEmail) {
    return (
      <AuthCard title="Vérifiez votre boîte mail">
        <div className="space-y-4 text-center text-sm text-gray-600">
          <p>
            Si cette adresse peut être utilisée, un e-mail de confirmation vient d&apos;être envoyé à{' '}
            <strong className="text-jardinerie-text">{registeredEmail}</strong>.
          </p>
          <p>Cliquez sur le lien qu&apos;il contient pour activer votre compte. Pensez à regarder dans vos courriers indésirables.</p>
          <Link href="/connexion" className="inline-block font-medium text-jardinerie-primary underline">
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    );
  }

  const waiting = secondsLeft > 0;
  const shown = (name) => (touched[name] ? fieldErrors[name] : null);

  return (
    <AuthCard title="Créer mon compte">
      <FormMessage>{error}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="first_name"
            label="Prénom"
            autoComplete="given-name"
            value={form.first_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={shown('first_name')}
            valid={touched.first_name && !fieldErrors.first_name}
            required
          />
          <TextField
            id="last_name"
            label="Nom"
            autoComplete="family-name"
            value={form.last_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={shown('last_name')}
            valid={touched.last_name && !fieldErrors.last_name}
            required
          />
        </div>

        <TextField
          id="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shown('email')}
          valid={touched.email && !fieldErrors.email}
          required
        />

        <div>
          <PasswordField
            id="password"
            label="Mot de passe"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={shown('password')}
            required
          />
          <PasswordRules password={form.password} />
        </div>

        <PasswordField
          id="confirm_password"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          value={form.confirm_password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={shown('confirm_password')}
          required
        />

        <Checkbox id="gdpr_consent" checked={form.gdpr_consent} onChange={handleChange} error={shown('gdpr_consent')}>
          J&apos;accepte les{' '}
          <Link href="/cgv" target="_blank" className="text-jardinerie-primary underline">
            Conditions Générales de Vente
          </Link>{' '}
          et la{' '}
          <Link href="/politique-confidentialite" target="_blank" className="text-jardinerie-primary underline">
            politique de confidentialité
          </Link>
          .
        </Checkbox>

        <SubmitButton loading={submitting} loadingLabel="Création en cours..." disabled={waiting}>
          {waiting ? `Réessayer dans ${formatWait(secondsLeft)}` : 'Créer mon compte'}
        </SubmitButton>

        <p className="text-center text-sm">
          <Link href="/connexion" className="font-medium text-jardinerie-primary hover:underline">
            Déjà un compte ? Connectez-vous
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
