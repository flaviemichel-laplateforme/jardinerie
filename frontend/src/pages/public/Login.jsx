import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Utilisation de votre hook personnalisé
  const { loading, error, request } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // L'URL vient du service, les options (credentials, headers, body) aussi
    const result = await request(
      authService.buildLoginUrl(),
      buildRequestOptions({ method: 'POST', body: { email, password } })
    );

       if (result.success) {
      login(result.data.user);
      const from = location.state?.from || '/';
      navigate(from, { replace:true });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-jardinerie-text">
          Se connecter !
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-jardinerie-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:opacity-70"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}