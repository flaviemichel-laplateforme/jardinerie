import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    // Récupération sécurisée du token et des données utilisateur au démarrage
    const [token, setToken] = useState(() => localStorage.getItem('jardinerie_token'))
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('jardinerie_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Erreur de lecture des données utilisateurs", error);
            return null;
        }
    });

    const isAuthenticated = !!token;

    // Fonction de connexion : sauvegarde en mémoire et dans le navigateur
    const login = (userData, authToken) => {
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('jardinerie_token', authToken);
        localStorage.setItem('jardinerie_user', JSON.stringify(userData));
    };

    //Fonction de deconnexion : nettoyage complet
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('jardinerie_token');
        localStorage.removeItem('jardinerie_user');
    };

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

// 3. Custom Hook pour consommer le contexte
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};