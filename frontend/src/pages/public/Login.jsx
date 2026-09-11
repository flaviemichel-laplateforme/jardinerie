import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';
import toast from 'react-hot-toast'; // Ajout des notifications

// Regex email native des navigateurs (HTML Living Standard), identique à Register.jsx.
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { loading, error, request } = useApi();

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  // Vérification du format de l'email.
  const fieldErrors = {
    email: email.trim() === ''
      ? "L'adresse email est obligatoire."
      : !EMAIL_REGEX.test(email.trim())
        ? "Adresse email invalide."
        : null,
    password: password === ''
      ? "Le mot de passe est obligatoire."
      : null,
  };

  const getInputClassName = (fieldName) => {
    const base = "mt-2 w-full rounded-lg border p-3 focus:outline-none focus:ring-1 transition-colors";
    if (!touched[fieldName]) {
      return `${base} border-gray-300 focus:border-jardinerie-primary focus:ring-jardinerie-primary`;
    }
    return fieldErrors[fieldName]
      ? `${base} border-red-400 focus:border-red-400 focus:ring-red-400`
      : `${base} border-green-500 focus:border-green-500 focus:ring-green-500`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Affiche les erreurs même si l'utilisateur soumet sans avoir quitté un champ.
    setTouched({ email: true, password: true });

    if (Object.values(fieldErrors).some(Boolean)) {
      toast.error("Merci de corriger les champs invalides.");
      return;
    }

    const result = await request(
      authService.buildLoginUrl(),
      buildRequestOptions({ method: 'POST', body: { email, password } })
    );

    if (result.success) {
      const user = result.data.user;
      
      // 1. Mise à jour du contexte d'authentification
      login(user);
      
      // 2. Message de bienvenue personnalisé
      toast.success(`Bienvenue ${user.first_name || ''} !`);

      // 3. Aiguillage basé sur le rôle (La méthode Pro)
      if (user.role === 'admin') {
        // Si c'est un administrateur, direction le tableau de bord
        navigate('/admin', { replace: true });
      } else {
        // Si c'est un client, on le renvoie d'où il vient (ex: son panier) 
        // ou par défaut vers son espace client
        const from = location.state?.from || '/compte';
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-jardinerie-text">
          Se connecter
        </h2>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleBlur}
              className={getInputClassName('email')}
              required
            />
            {touched.email && fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handleBlur}
              className={getInputClassName('password')}
              required
            />
            {touched.password && fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
            <div className="mt-2 text-right">
              <Link to="/mot-de-passe-oublie" className="text-sm font-medium text-jardinerie-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-jardinerie-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:opacity-70 "
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
          
          <div className='flex items-center justify-center'>
            <Link to="/inscription" className="font-medium text-jardinerie-primary hover:bg-jardinerie-primary hover:text-white px-4 py-1.5 rounded-full transition-all">
              Pas encore de compte ? Inscrivez-vous !
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}