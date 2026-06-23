import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  // Récupération des outils de navigation et d'authentification ---
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); 

  // La fonction intelligente du bouton ---
  const handleCheckout = () => {
    if (isAuthenticated) {
      // S'il a son "badge" (true), on l'envoie à l'étape 2
      navigate('/commande/livraison');
    } else {
      // S'il n'est pas connecté (false), on l'envoie vers la connexion
      // Et on glisse un petit post-it dans l'URL pour lui dire où revenir après !
      navigate('/connexion', { state: { from: '/commande/livraison' } });
    }
  };

  const totalTTC = cartTotal;
  
  // On calcule le HT en additionnant le HT de chaque ligne séparément
  const totalHT = cartItems.reduce((acc, item) => {
    const itemTTC = item.price * item.quantity;
    const itemRate = item.tax_rate / 100; // Utilisation de tax_rate (ex: 20 devient 0.20)
    const itemHT = itemTTC / (1 + itemRate);
    return acc + itemHT;
  }, 0);

  // La TVA totale est la différence exacte entre le TTC et le HT
  const tva = totalTTC - totalHT;
  
  const isFreeShipping = totalTTC >= 50 || totalTTC === 0;
  const shippingCost = isFreeShipping ? 0 : 7.90;
  const finalTotal = totalTTC + shippingCost;

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-jardinerie-text mb-4">Votre panier est vide</h1>
        <Link to="/vegetaux" className="rounded-full bg-jardinerie-primary px-8 py-3.5 text-sm font-bold text-white">
          Découvrir nos végétaux
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      
      {/* --- BARRE DE PROGRESSION (STEPPER) --- */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-1 bg-jardinerie-primary -z-10 transition-all"></div>
          
          <div className="flex flex-col items-center bg-white px-2">
            <div className="h-10 w-10 rounded-full bg-jardinerie-primary text-white flex items-center justify-center font-bold border-4 border-white shadow-sm">1</div>
            <span className="text-xs font-bold text-jardinerie-primary mt-2">Panier</span>
          </div>
          <div className="flex flex-col items-center bg-white px-2">
            <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold border-4 border-white">2</div>
            <span className="text-xs font-medium text-gray-400 mt-2">Livraison</span>
          </div>
          <div className="flex flex-col items-center bg-white px-2">
            <div className="h-10 w-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold border-4 border-white">3</div>
            <span className="text-xs font-medium text-gray-400 mt-2">Paiement</span>
          </div>
        </div>
      </div>

      {/* --- STRUCTURE GRILLE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* COLONNE GAUCHE : LISTE DES ARTICLES */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 flex gap-4 relative">
              
              {/* Image */}
              <Link to={`/produit/${item.id}`} className="shrink-0">
                <img 
                  src={item.image || 'https://via.placeholder.com/100'} 
                  alt={item.name} 
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover bg-gray-50 border border-gray-100"
                />
              </Link>

              {/* Contenu */}
              <div className="flex flex-col justify-between flex-1">
                <div className="pr-8">
                  <h3 className="text-sm sm:text-base font-bold text-jardinerie-text leading-tight">
                    <Link to={`/produit/${item.id}`}>{item.name}</Link>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">RÉF-{item.id.toString().padStart(6, '0')}</p>
                </div>
                
                <div className="flex items-end justify-between mt-4">
                  <p className="font-black text-lg text-jardinerie-primary">
                    {item.price.toFixed(2).replace('.', ',')} €
                  </p>
                  
                  {/* Sélecteur de quantité */}
                  <div className="flex items-center border border-gray-200 rounded-full bg-white h-8">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 text-jardinerie-text hover:text-jardinerie-primary disabled:opacity-30"
                      disabled={item.quantity <= 1}
                    >−</button>
                    <span className="w-6 text-center font-medium text-sm text-jardinerie-text">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 text-jardinerie-text hover:text-jardinerie-primary disabled:opacity-30"
                      disabled={item.quantity >= item.stock_max}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* 2. Icône Corbeille avec Lucide */}
              <button 
                onClick={() => removeFromCart(item.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                aria-label="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>

            </div>
          ))}
        </div>

        {/* COLONNE DROITE : RÉSUMÉ (STICKY AVEC SELF-START) */}
        <div className="lg:col-span-4 sticky top-24 self-start">
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-jardinerie-text mb-6">Résumé</h2>
            
            <div className="space-y-3 text-sm text-jardinerie-text/70 mb-6">
              <div className="flex justify-between">
                <span>Sous-total HT</span>
                <span>{totalHT.toFixed(2).replace('.', ',')} €</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span className="font-bold text-jardinerie-text">{isFreeShipping ? 'Gratuite' : `${shippingCost.toFixed(2).replace('.', ',')} €`}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA 20%</span>
                <span>{tva.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8 flex justify-between items-end">
              <span className="font-bold text-jardinerie-text uppercase tracking-wide">Total</span>
              <span className="text-2xl font-black text-jardinerie-primary">{finalTotal.toFixed(2).replace('.', ',')} €</span>
            </div>

            <button 
              onClick={handleCheckout}
              className="block w-full text-center bg-transparent border border-jardinerie-text rounded-md py-3 text-sm font-bold text-jardinerie-text uppercase tracking-wider hover:bg-jardinerie-primary hover:text-white hover:border-jardinerie-primary transition-all mb-6"
            >
              Valider
            </button>

            {/* 3. Badges de réassurance avec Lucide */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-jardinerie-text/50 font-bold mb-3">Paiement sécurisé</span>
              <div className="flex justify-center gap-5 text-jardinerie-text/80">
                <CreditCard className="w-6 h-6 hover:text-jardinerie-primary transition-colors" />
                <ShieldCheck className="w-6 h-6 hover:text-jardinerie-primary transition-colors" />
                <Smartphone className="w-6 h-6 hover:text-jardinerie-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}