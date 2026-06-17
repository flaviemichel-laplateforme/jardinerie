import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';
import ProductCard from './components/catalog/ProductCard';

const mockProduct = {
  id: 1,
  product_name: 'Basilic grand vert',
  subcategory_name: 'Plantes aromatiques',
  price_tax_incl: 4.9,
  main_image_url: 'https://via.placeholder.com/400x400?text=ProductCard',
  stock_quantity: 12,
  sun_exposure: 'sun',
  packaging_options: 2,
};

// Composants temporaires pour tester l'affichage
const Home = () => <div className="p-4">
  <h1>Page d'Accueil</h1>
<p>Contenu public</p>
<div className="mt-6 max-w-sm">
  <ProductCard product={mockProduct} />
</div>
</div>;
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