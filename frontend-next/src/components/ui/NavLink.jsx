'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Équivalent du NavLink de react-router (absent de Next.js) : un lien qui sait s'il correspond à la page affichée.
 * - className peut être une fonction qui reçoit { isActive }, comme avant ;
 * - end : actif seulement sur l'adresse exacte (indispensable pour "/", sinon l'accueil serait actif partout).
 */
export default function NavLink({ href, end = false, className, ...props }) {
  const pathname = usePathname();
  const path = href.split('?')[0];
  const isActive = end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <Link href={href} className={resolvedClassName} aria-current={isActive ? 'page' : undefined} {...props} />
  );
}
