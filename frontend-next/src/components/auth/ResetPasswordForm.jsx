'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useFormRequest } from '../../hooks/useFormRequest';
import { authService } from '../../services/authService';
import { getPasswordRules, formatWait } from '../../utils/validation';
import AuthCard from './AuthCard';
import PasswordField from '../forms/PasswordField';
import PasswordRules from '../forms/PasswordRules';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Le jeton vient du lien de l'e-mail. On le garde en mémoire à l'ouverture de la page, puis on l'efface de la barre d'adresse
  // (sinon il resterait dans l'historique du navigateur et pourrait fuiter par l'en-tête Referer).
  const [token] = useState(() => searchParams.get('token') ?? '');
  useEffect(() => {
    if (token) window.history.replaceState(null, '', window.location.pathname);
  }, [token]);

  const { send, submitting, error, secondsLeft } = useFormRequest();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({});

  const failedRule = getPasswordRules(newPassword).find((rule) => !rule.valid);
  const fieldErrors = {
    new_password: failedRule ? `Il manque : ${failedRule.label.toLowerCase()}.` : null,
    confirm_password: confirmPassword !== newPassword ? 'Les mots de passe ne correspondent pas.' : null,
  };

  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ new_password: true, confirm_password: true });
    if (Object.values(fieldErrors).some(Boolean)) return;

    const result = await send(authService.buildResetPasswordUrl(), { token, new_password: newPassword });

    if (result.ok) {
      toast.success('Mot de passe modifié. Vous pouvez vous connecter.');
      router.push('/connexion');
    }
  };

  if (!token) {
    return (
      <AuthCard title="Lien invalide">
        <div className="space-y-4 text-center text-sm text-gray-600">
          <p>Ce lien est incomplet. Merci de redemander un e-mail de réinitialisation.</p>
          <Link href="/mot-de-passe-oublie" className="inline-block font-medium text-jardinerie-primary underline">
            Redemander un lien
          </Link>
        </div>
      </AuthCard>
    );
  }

  const waiting = secondsLeft > 0;

  return (
    <AuthCard title="Nouveau mot de passe">
      <FormMessage>{error}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <PasswordField
            id="new_password"
            label="Nouveau mot de passe"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            onBlur={handleBlur}
            error={touched.new_password ? fieldErrors.new_password : null}
            required
          />
          <PasswordRules password={newPassword} />
        </div>

        <PasswordField
          id="confirm_password"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          onBlur={handleBlur}
          error={touched.confirm_password ? fieldErrors.confirm_password : null}
          required
        />

        <SubmitButton loading={submitting} loadingLabel="Enregistrement..." disabled={waiting}>
          {waiting ? `Réessayer dans ${formatWait(secondsLeft)}` : 'Changer le mot de passe'}
        </SubmitButton>

        <p className="text-center text-sm">
          <Link href="/mot-de-passe-oublie" className="font-medium text-jardinerie-primary hover:underline">
            Ce lien a expiré ? Redemander un lien
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
