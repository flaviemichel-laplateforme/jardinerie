/** « 2026-11-02 14:30:00 » -> « 02 novembre 2026 ». Renvoie « — » si la date est absente ou illisible. */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** 12.5 -> « 12,50 € » (l'API renvoie les montants en texte : « 12.50 »). */
export function formatEuro(amount) {
  return `${Number(amount).toFixed(2).replace('.', ',')} €`;
}
