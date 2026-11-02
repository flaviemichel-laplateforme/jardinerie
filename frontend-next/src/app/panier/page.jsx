import CartPage from '../../components/cart/CartPage';

// Le panier est propre à chaque visiteur (enregistré dans son navigateur) : rien à référencer.
export const metadata = {
  title: 'Mon panier',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CartPage />;
}
