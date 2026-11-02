'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormRequest } from '../../hooks/useFormRequest';
import { authService } from '../../services/authService';
import { validateEmail, formatWait } from '../../utils/validation';
import AuthCard from './AuthCard';
import TextField from '../forms/TextField';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';

export default function ForgotPasswordForm() {
  const { send, submitting, error, secondsLeft } = useFormRequest();

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const emailError = validateEmail(email);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (emailError) return;

    const result = await send(authService.buildRequestPasswordResetUrl(), { email: email.trim() });
    if (result.ok) setSentTo(email.trim());
  };

  // Même réponse que le compte existe ou non : on ne révèle pas quelles adresses sont inscrites.
  if (sentTo) {
    return (
      <AuthCard title="Vérifiez votre boîte mail">
        <div className="space-y-4 text-center text-sm text-gray-600">
          <p>
            Si un compte existe avec l&apos;adresse <strong className="text-jardinerie-text">{sentTo}</strong>, un e-mail contenant
            un lien de réinitialisation vient de lui être envoyé. Ce lien est valable 1 heure.
          </p>
          <Link href="/connexion" className="inline-block font-medium text-jardinerie-primary underline">
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    );
  }

  const waiting = secondsLeft > 0;

  return (
    <AuthCard title="Mot de passe oublié">
      <p className="mb-6 text-center text-sm text-gray-600">
        Saisissez l&apos;adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </p>

      <FormMessage>{error}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <TextField
          id="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched(true)}
          error={touched ? emailError : null}
          valid={touched && !emailError}
          required
        />

        <SubmitButton loading={submitting} loadingLabel="Envoi en cours..." disabled={waiting}>
          {waiting ? `Réessayer dans ${formatWait(secondsLeft)}` : 'Envoyer le lien'}
        </SubmitButton>

        <p className="text-center text-sm">
          <Link href="/connexion" className="font-medium text-jardinerie-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
