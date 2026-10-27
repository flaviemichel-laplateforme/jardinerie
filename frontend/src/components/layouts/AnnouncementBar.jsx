import { FREE_SHIPPING_THRESHOLD } from '../../constants/shipping';

// Bandeau d'information tout en haut du site. Volontairement placé au-dessus du header et non collant :
// il défile avec la page, donc il ne réduit pas l'espace utile et la hauteur du header collant ne change pas.
export default function AnnouncementBar() {
  return (
    <p className="bg-jardinerie-text px-4 py-2 text-center text-xs font-bold text-jardinerie-light sm:text-sm">
      Livraison offerte dès {FREE_SHIPPING_THRESHOLD} € d&apos;achat
    </p>
  );
}
