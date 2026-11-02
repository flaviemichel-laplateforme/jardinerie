import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { sendJson } from '../services/requestJson';
import { cartService } from '../services/cartService';
import { formatEuro } from '../constants/shipping';

// Attente avant d'interroger l'API quand on clique plusieurs fois de suite sur « + » : une seule requête pour la dernière quantité
const DEBOUNCE_MS = 300;

/**
 * Résumé du panier d'après la base (prix, stock, TVA, livraison, total), plus les changements à signaler au client.
 *
 * Le panier enregistré dans le navigateur peut dater de plusieurs jours. Dès que le résumé arrive :
 * - prix, TVA, stock et quantités des articles sont alignés sur la base (CartContext.syncWithServer) ;
 * - ce qui a changé est listé dans `notices` (« le prix de X est passé de… », « quantité ramenée à… ») : le client ne doit jamais payer autre
 *   chose que ce qu'il croit voir ;
 * - `unavailableIds` liste les articles qu'on ne peut plus acheter (retirés de la vente, en rupture) : il faut les retirer pour continuer.
 *
 * status : 'loading' (premier calcul en cours), 'refreshing' (recalcul après un changement), 'ok', ou 'error' (API injoignable : la page
 * affiche une estimation locale).
 */
export function useCartSummary() {
  const { cartItems, isCartLoaded, syncWithServer } = useCart();

  // Une requête par « forme » du panier (articles + quantités) : changer un prix en local ne relance rien
  const lines = useMemo(() => cartItems.map((item) => ({ product_id: item.id, quantity: item.quantity })), [cartItems]);
  const requestKey = JSON.stringify(lines);

  const [state, setState] = useState({ summary: null, status: 'loading', notices: [], forKey: null });

  useEffect(() => {
    if (!isCartLoaded || lines.length === 0) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      sendJson(cartService.buildSummaryUrl(), { body: { items: lines }, signal: controller.signal }).then((result) => {
        if (controller.signal.aborted) return;

        if (!result.ok) {
          setState((previous) => ({ ...previous, status: 'error', forKey: requestKey }));
          return;
        }

        const summary = result.data;
        const byId = new Map(summary.items.map((item) => [item.product_id, item]));
        const notices = [];

        for (const item of cartItems) {
          const fresh = byId.get(item.id);
          if (!fresh) continue;

          if (fresh.quantity < fresh.requested_quantity) {
            notices.push(`La quantité de « ${fresh.name} » a été ramenée à ${fresh.quantity} (stock disponible).`);
          }
          if (Math.abs(fresh.unit_price - item.price) > 0.005) {
            notices.push(`Le prix de « ${fresh.name} » est passé de ${formatEuro(item.price)} à ${formatEuro(fresh.unit_price)}.`);
          }
        }

        syncWithServer(summary.items);
        setState({ summary, status: 'ok', notices, forKey: requestKey });
      });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `lines` et `cartItems` changent ensemble avec `requestKey` : on ne relance que lorsque la forme du panier change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, isCartLoaded]);

  const unavailableIds = useMemo(() => {
    if (!state.summary || lines.length === 0) return [];
    return state.summary.problems
      .filter((problem) => problem.reason === 'unavailable' || problem.reason === 'out_of_stock')
      .map((problem) => problem.product_id)
      .filter((id) => cartItems.some((item) => item.id === id));
  }, [state.summary, lines.length, cartItems]);

  const dismissNotices = () => setState((previous) => ({ ...previous, notices: [] }));

  // Panier vide : rien à calculer. Sinon, tant que la réponse ne correspond pas au panier actuel, on recalcule : « loading » au tout
  // premier calcul, « refreshing » ensuite (le dernier résumé reste affiché pendant que le nouveau arrive).
  const empty = lines.length === 0;
  const upToDate = state.forKey === requestKey;
  let status;
  if (empty) status = 'ok';
  else if (upToDate) status = state.status;
  else status = state.summary ? 'refreshing' : 'loading';

  return {
    summary: empty ? null : state.summary,
    status,
    notices: empty ? [] : state.notices,
    unavailableIds,
    dismissNotices,
  };
}
