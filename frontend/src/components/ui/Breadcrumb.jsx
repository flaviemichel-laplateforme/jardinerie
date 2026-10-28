import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Fil d'Ariane accessible : une vraie liste dans une <nav> nommée, avec la page courante signalée par aria-current.
 * Sur mobile : une seule ligne sans cadre (elle défile horizontalement si elle est trop longue) ;
 * à partir de md : dans un cadre.
 *
 * @param {{ label: string, to?: string }[]} items - Les étapes. La dernière, sans `to`, est la page courante.
 */
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Fil d'Ariane" className="md:rounded md:border md:border-gray-200 md:bg-white md:p-3">
      <ol className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-4 py-3 text-sm text-gray-600 [scrollbar-width:none] md:p-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-1">
            {index > 0 && <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-jardinerie-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-gray-900">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
