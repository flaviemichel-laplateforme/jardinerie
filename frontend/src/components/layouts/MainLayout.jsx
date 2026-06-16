import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const location = useLocation();
  
  // Logique simple pour déterminer si on affiche la sidebar
  // (La sidebar s'affiche si l'URL commence par /admin ou /account)
  const isPrivateSpace = location.pathname.startsWith('/admin') || location.pathname.startsWith('/account');
  
  // Mockup des données utilisateur (sera remplacé plus tard par votre vrai Token JWT)
  const userRole = location.pathname.startsWith('/admin') ? 'admin' : 'client';
  const userName = location.pathname.startsWith('/admin') ? 'Admin' : 'Flavie';

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* 1. L'en-tête, toujours présent */}
      <Header />
      
      <div className="flex flex-grow">
        {/* 2. La barre latérale, présente uniquement dans les espaces privés */}
        {isPrivateSpace && <Sidebar userRole={userRole} userName={userName} />}
        
        {/* 3. Le contenu dynamique de la page (Le fameux Outlet !) */}
        <main className="flex-grow p-8 bg-jardinerie-bg/20">
          <Outlet />
        </main>
      </div>

      {/* 4. Le pied de page, toujours présent */}
      <Footer />
    </div>
  );
}