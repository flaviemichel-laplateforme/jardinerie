import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import { resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); 

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/commande/livraison');
    } else {
      navigate('/connexion', { state: { from: '/commande/livraison' } });
    }
  };

  const totalTTC = cartTotal;

  // Regroupe HT et TVA par taux distinct (ex: 5.5% et 20%),
  // car le panier peut contenir des produits avec des taux différents
  const vatBreakdown = cartItems.reduce((acc, item) => {
    const rate = item.tax_rate;
    const itemTTC = item.price * item.quantity;
    const itemHT = itemTTC / (1 + rate / 100);
    const itemTVA = itemTTC - itemHT;

    if (!acc[rate]) acc[rate] = { ht: 0, tva: 0 };
    acc[rate].ht += itemHT;
    acc[rate].tva += itemTVA;

    return acc;
  }, {});

  const totalHT = Object.values(vatBreakdown).reduce((sum, { ht }) => sum + ht, 0);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        <div className="lg:col-span-8 flex flex-col gap-4">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 flex gap-4 relative">
              
              <Link to={`/produit/${item.id}`} className="shrink-0">
                <img 
                  src={item.image ? resolveAssetUrl(item.image) : placeholderImg } 
                  alt={item.name}
                  onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg}} 
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover bg-gray-50 border border-gray-100"
                />
              </Link>

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
              {Object.entries(vatBreakdown).map(([rate, { tva }]) => (
                <div key={rate} className="flex justify-between">
                  <span>TVA {rate}%</span>
                  <span>{tva.toFixed(2).replace('.', ',')} €</span>
                </div>
              ))}
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