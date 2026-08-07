import { createContext, useContext, useState, useEffect } from "react";
import Spinner from '../components/ui/Spinner';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Bloque l'affichage le temps de vérifier la session

  const isAuthenticated = !!user;

  // 1. SILENT LOGIN : Vérification au démarrage
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(authService.buildMeUrl(), {
          method: 'GET',
          credentials: 'include', // INDISPENSABLE : Envoie le cookie HttpOnly au serveur PHP
          headers: {
            'Accept': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Le cookie est valide, on connecte l'utilisateur
          setUser(data.data.user);
        } else {
          // Pas de session active
          setUser(null);
        }
      } catch (error) {
        console.error("Erreur réseau lors de la vérification de session :", error);
        setUser(null);
      } finally {
        setLoading(false); // La vérification est terminée, on peut afficher le site
      }
    };

    verifySession();
  }, []);

  // 2. Fonction de connexion (Appelée par votre formulaire de login)
  // Plus besoin de gérer le token ici, le navigateur s'en occupe tout seul !
  const login = (userData) => {
    setUser(userData);
  };

  // 3. Fonction de déconnexion
  const logout = async () => {
    // Optionnel mais recommandé : appeler une route PHP /api/auth/logout pour détruire le cookie côté serveur
    try {
      await fetch(authService.buildLogoutUrl(), {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    }
    
    // Nettoyage de l'état React
    setUser(null);
  };

  // Écran d'attente subtil pendant la vérification du cookie (évite le clignotement)
  if (loading) {
    return <Spinner message="Chargement en cours..." />;
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook pour consommer le contexte
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};