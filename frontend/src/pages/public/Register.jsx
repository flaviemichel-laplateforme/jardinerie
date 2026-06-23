import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';
import logoImage from '../../assets/img/Logo.png';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const response = await request(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password
      }) 
    });

    if (response.success) {
      toast.success("Bienvenue ! Votre compte a été créé.");
      login(response.data.user); 
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex bg-jardinerie-light font-sans">
      
      {/* SECTION GAUCHE : Le Formulaire (50% sur Desktop, 100% sur Mobile) */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 lg:w-1/2 w-full">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
                  <Link to="/" className="flex items-center">
                    <img
                      src={logoImage}
                      alt="La Jardinerie"
                      className="h-24 w-70 rounded-full border border-jardinerie-primary bg-white object-cover shadow-sm scale-110"
                    />
                  </Link>
          
          {/* En-tête */}
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
              Rejoignez notre communauté !
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ou{' '}
              <Link to="/connexion" className="font-medium text-green-600 hover:text-green-500 transition-colors">
                connectez-vous à votre compte existant
              </Link>
            </p>
          </div>

          {/* Formulaire */}
          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Prénom & Nom */}
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
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
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
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                />
              </div>

              {/* Confirmation Mot de passe */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                />
              </div>

              {/* Bouton de soumission */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ? 'bg-jardinerie-primary cursor-not-allowed' : 'bg-jardinerie-primary hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  } transition-colors`}
                >
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION DROITE : L'image d'illustration (Cachée sur mobile 'hidden', visible sur desktop 'lg:block') */}
      <div className="hidden lg:block relative w-0 flex-1">
        {/* Vous pourrez remplacer cette URL par une image de votre dossier public (ex: '/images/jardinerie-bg.jpg') */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/src/assets/img/fond.png"
          alt="Feuilles tropicales"
        />
        {/* Un léger voile vert par-dessus l'image pour adoucir le contraste */}
        <div className="absolute inset-0 bg-green-900 mix-blend-multiply opacity-10"></div>
      </div>

    </div>
  );
}