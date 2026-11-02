'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useFormRequest } from '../../hooks/useFormRequest';
import { authService } from '../../services/authService';
import { validateEmail, formatWait } from '../../utils/validation';
import { safeRedirect } from '../../utils/safeRedirect';
import AuthCard from './AuthCard';
import TextField from '../forms/TextField';
import PasswordField from '../forms/PasswordField';
import SubmitButton from '../forms/SubmitButton';
import FormMessage from '../forms/FormMessage';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Où revenir après la connexion (ex. /connexion?redirect=/compte/commandes) : toujours un chemin du site, jamais un autre domaine
  const target = safeRedirect(searchParams.get('redirect'));

  const { isAuthenticated, loading, login } = useAuth();
  const { send, submitting, error, secondsLeft } = useFormRequest();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});

  // Une seule porte de sortie : dès que la session est connue, on part. Elle couvre à la fois la connexion qui vient
  // d'aboutir et la personne déjà connectée qui ouvre cette page.
  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(target);
  }, [loading, isAuthenticated, router, target]);

  const fieldErrors = {
    email: validateEmail(email),
    password: password === '' ? 'Le mot de passe est obligatoire.' : null,
  };

  const handleBlur = (event) => setTouched((previous) => ({ ...previous, [event.target.name]: true }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (Object.values(fieldErrors).some(Boolean)) {
      toast.error('Merci de corriger les champs invalides.');
      return;
    }

    const result = await send(authService.buildLoginUrl(), { email: email.trim(), password });

    if (result.ok) {
      const user = result.data.user;
      login(user);
      toast.success(`Bienvenue ${user.first_name || ''} !`);
    }
  };

  const waiting = secondsLeft > 0;

  return (
    <AuthCard title="Se connecter">
      <FormMessage>{error}</FormMessage>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <TextField
          id="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={handleBlur}
          error={touched.email ? fieldErrors.email : null}
          valid={touched.email && !fieldErrors.email}
          required
        />

        <div>
          <PasswordField
            id="password"
            label="Mot de passe"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={handleBlur}
            error={touched.password ? fieldErrors.password : null}
            required
          />
          <div className="mt-2 text-right">
            <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-jardinerie-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <SubmitButton loading={submitting} loadingLabel="Connexion en cours..." disabled={waiting}>
          {waiting ? `Réessayer dans ${formatWait(secondsLeft)}` : 'Se connecter'}
        </SubmitButton>

        <p className="text-center text-sm">
          <Link href="/inscription" className="font-medium text-jardinerie-primary hover:underline">
            Pas encore de compte ? Inscrivez-vous !
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
