import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi'; // Ajustez le chemin selon votre arborescence
import toast from 'react-hot-toast';

export default function Register() {
  // 1. État du formulaire
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  // 2. Appel de votre hook personnalisé
  const { loading, request } = useApi();

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Soumission simplifiée grâce au hook
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password ==! formData.confirm_password){
        toast.error("Les mots de passe ne correspondent pas.");
        return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // On délègue toute la complexité à la fonction request de votre hook
    const response = await request(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Indispensable pour le cookie HttpOnly
      body: JSON.stringify(formData)
    });

    // Si le hook renvoie success: true, on finalise la connexion
    if (response.success) {
      // response.data contient ce que le backend a envoyé dans result['data']
      login(response.data.user); 
      
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
    // Note : Si c'est un échec (ex: email déjà pris), nous n'avons rien à faire ici !
    // Votre hook a déjà intercepté l'erreur et affiché le toast d'erreur.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link to="/connexion" className="font-medium text-green-600 hover:text-green-500">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        {/* Le message d'erreur rouge a été supprimé ici car votre hook affiche un Toast ! */}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">Prénom</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm_password"
                name="confirm_password" // Doit correspondre exactement à la clé du state !
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.confirm_password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading} // Utilisation de la variable loading du hook
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              } transition-colors`}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}