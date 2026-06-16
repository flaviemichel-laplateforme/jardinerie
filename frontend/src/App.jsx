import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';

// Composants temporaires pour tester l'affichage
const Home = () => <div className="p-4"><h1>Page d'Accueil</h1><p>Contenu public</p></div>;
const AdminDashboard = () => <div className="p-4"><h1>Dashboard Admin</h1><p>Contenu privé</p></div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Toutes les routes encapsulées ici utiliseront le MainLayout (Header/Footer) */}
        <Route path="/" element={<MainLayout />}>
          
          {/* Routes publiques */}
          <Route index element={<Home />} />
          
          {/* Routes privées (La Sidebar s'affichera automatiquement selon la logique du layout) */}
          <Route path="admin" element={<AdminDashboard />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}