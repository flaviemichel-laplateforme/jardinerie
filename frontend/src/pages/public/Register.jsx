import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authService } from '../../services/authService';
import { buildRequestOptions } from '../../services/apiClient';
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

    const response = await request(
      authService.buildRegisterUrl(),
      buildRequestOptions({
        method: 'POST',
        body: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password
        }
      })
    );

    if (response.success) {
      toast.success("Bienvenue ! Votre compte a été créé.");
      login(response.data.user); 
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    // 1. La balise <main> avec l'image en plein écran
    <main 
      className="min-h-screen flex items-center justify-center font-sans bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/src/assets/img/fond.png')" }}
    >
      
      {/* 2. Un léger voile assombrissant pour garantir la lisibilité du formulaire */}
      <div className="absolute inset-0 bg-jardinerie-light/30 mix-blend-multiply"></div>

      {/* 3. La carte du formulaire (Glassmorphism : fond semi-transparent et flou) */}
      <div className="relative z-10 w-full max-w-lg p-8 m-4 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-md border border-white/50">
        
        {/* En-tête centré avec le Logo */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center mb-4">
            <img
              src={logoImage}
              alt="La Jardinerie"
              className="h-24 w-auto rounded-full border border-jardinerie-primary bg-white object-cover shadow-sm scale-110"
            />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center">
            Rejoignez notre communauté !
          </h2>
          <p className="mt-2 text-sm text-gray-800 text-center">
            Ou{' '}
            <Link to="/connexion" className="font-medium text-jardinerie-primary hover:text-green-700 transition-colors">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        {/* Formulaire */}
        <div className="mt-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Prénom & Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-900">Prénom</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm bg-white/95 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-900">Nom</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm bg-white/95 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm bg-white/95 transition-colors"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm bg-white/95 transition-colors"
              />
            </div>

            {/* Confirmation Mot de passe */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-900">Confirmer le mot de passe</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.confirm_password}
                onChange={handleChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-jardinerie-primary focus:border-jardinerie-primary sm:text-sm bg-white/95 transition-colors"
              />
            </div>

            {/* Bouton de soumission */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-jardinerie-primary opacity-70 cursor-not-allowed' : 'bg-jardinerie-primary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jardinerie-primary'
                } transition-all duration-200`}
              >
                {loading ? 'Création en cours...' : 'Créer mon compte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}