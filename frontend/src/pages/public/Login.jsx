import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';
import toast from 'react-hot-toast'; // Ajout des notifications

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { loading, error, request } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();

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