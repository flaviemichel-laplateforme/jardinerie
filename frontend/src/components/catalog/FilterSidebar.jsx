import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';

export default function FilterSidebar({
  activeCategories = [],
  activeExpositions = [],
  activeWater = [],
  activePrice = { min: '', max: '' },
  onFilterChange,
  onReset,
}) {
  const { data: apiFilters, loading, error, request } = useApi();

  const MIN = 0;
  const MAX = 500;

  const [priceMin, setPriceMin] = useState(activePrice.min !== '' ? Number(activePrice.min) : MIN);
  const [priceMax, setPriceMax] = useState(activePrice.max !== '' ? Number(activePrice.max) : MAX);

  // Appel API réseau au montage
  useEffect(() => {
    const controller = new AbortController();
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/filters`;
    
    request(url, { signal: controller.signal }, false);

    return () => controller.abort();
  }, [request]);

  // Synchronisation avec les filtres effacés depuis le parent
  useEffect(() => {
    setPriceMin(activePrice.min !== '' ? Number(activePrice.min) : MIN);
    setPriceMax(activePrice.max !== '' ? Number(activePrice.max) : MAX);
  }, [activePrice.min, activePrice.max]);

  const updateFilters = (patch) => {
    onFilterChange({
      categories: activeCategories,
      expositions: activeExpositions,
      water: activeWater,
      price: { min: String(priceMin), max: String(priceMax) },
      ...patch,
    });
  };

  const toggleValue = (list, value) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const handleCheckboxChange = (filterType, value) => {
    const stringValue = String(value);
    if (filterType === 'categories') updateFilters({ categories: toggleValue(activeCategories, stringValue) });
    if (filterType === 'expositions') updateFilters({ expositions: toggleValue(activeExpositions, stringValue) });
    if (filterType === 'water') updateFilters({ water: toggleValue(activeWater, stringValue) });
  };

  const handleMinInput = (value) => {
    const nextMin = Math.min(Math.max(Number(value) || MIN, MIN), priceMax);
    setPriceMin(nextMin);
  };

  const handleMaxInput = (value) => {
    const nextMax = Math.max(Math.min(Number(value) || MAX, MAX), priceMin);
    setPriceMax(nextMax);
  };

  const commitPriceChange = () => {
    updateFilters({ price: { min: String(priceMin), max: String(priceMax) } });
  };

  const resetPrice = () => {
    setPriceMin(MIN);
    setPriceMax(MAX);
    updateFilters({ price: { min: '', max: '' } });
  };

  const hasActiveFilters =
    activeCategories.length > 0 ||
    activeExpositions.length > 0 ||
    activeWater.length > 0 ||
    (activePrice && (activePrice.min !== '' || activePrice.max !== ''));

  // SÉCURITÉ 1 : État de chargement élégant (évite le plantage "options is not defined")
  if (loading || !apiFilters) {
    return (
      <aside className="mb-8 w-full shrink-0 pr-0 md:mb-0 md:w-64 md:pr-6 h-96 animate-pulse bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Chargement des filtres...</span>
      </aside>
    );
  }

  // SÉCURITÉ 2 : Si l'API échoue, on affiche un message propre, l'app ne crashe pas
  if (error) {
    return (
      <aside className="mb-8 w-full shrink-0 pr-0 md:mb-0 md:w-64 md:pr-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          Impossible de charger les filtres pour le moment.
        </div>
      </aside>
    );
  }

 // 1. Définition de l'ordre logique souhaité pour l'affichage (UX)
  const exposureOrder = ['Sun', 'Partial Shade', 'Shade'];
  const waterOrder = ['Low', 'Medium', 'High'];

  // 2. Assignation et tri dynamique basé sur l'index de nos tableaux de référence
  const options = {
    categories: apiFilters.categories || [],
    
    expositions: (apiFilters.expositions || []).sort(
      (a, b) => exposureOrder.indexOf(a.id) - exposureOrder.indexOf(b.id)
    ),
    
    water: (apiFilters.water || []).sort(
      (a, b) => waterOrder.indexOf(a.id) - waterOrder.indexOf(b.id)
    ),
  };

  const translateLabel = (technicalValue) => {
    const dictionary = {
      'Sun': 'Plein Soleil',
      'Partial Shade': 'Mi-ombre',
      'Shade': 'Ombre',
      'Low': 'Arrosage faible',
      'Medium': 'Arrosage moyen',
      'High': 'Arrosage élevé'
    };
    // Si on trouve la traduction on l'affiche, sinon on affiche la valeur brute par sécurité
    return dictionary[technicalValue] || technicalValue; 
  };

  return (
    <aside className="mb-8 w-full shrink-0 pr-0 md:mb-0 md:w-64 md:pr-6">
      <div className="rounded-2xl border border-jardinerie-primary/10 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="font-bold uppercase tracking-wider text-jardinerie-text">Filtres</h2>
          {hasActiveFilters && (
            <button onClick={onReset} className="text-xs font-medium text-red-500 underline transition-colors hover:text-red-700">
              Effacer tout
            </button>
          )}
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-jardinerie-text/80">Catégories</h3>
          <div className="flex flex-col space-y-2">
            {options.categories.map((cat) => (
              <label key={`cat-${cat.id}`} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-2 focus:ring-jardinerie-primary/50"
                  checked={activeCategories.includes(String(cat.id))}
                  onChange={() => handleCheckboxChange('categories', cat.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-jardinerie-text/80">
            Exposition
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="12" r="4.25" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2.5v2.2" /><path d="M12 19.3v2.2" /><path d="M2.5 12h2.2" /><path d="M19.3 12h2.2" />
                <path d="M5.1 5.1l1.6 1.6" /><path d="M17.3 17.3l1.6 1.6" /><path d="M5.1 18.9l1.6-1.6" /><path d="M17.3 6.7l1.6-1.6" />
              </g>
            </svg>
          </h3>
          <div className="flex flex-col space-y-2">
            {options.expositions.map((exp) => (
              <label key={`exp-${exp.id}`} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-2 focus:ring-jardinerie-primary/50"
                  checked={activeExpositions.includes(String(exp.id))}
                  onChange={() => handleCheckboxChange('expositions', exp.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">{translateLabel(exp.id)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-jardinerie-text/80">
            Besoins en eau
            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 3c-3 3.6-5 6.4-5 9 0 3 2.2 5 5 5s5-2 5-5c0-2.6-2-5.4-5-9z" fill="currentColor" />
            </svg>
          </h3>
          <div className="flex flex-col space-y-2">
            {options.water.map((w) => (
              <label key={`water-${w.id}`} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-2 focus:ring-jardinerie-primary/50"
                  checked={activeWater.includes(String(w.id))}
                  onChange={() => handleCheckboxChange('water', w.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">{translateLabel(w.id)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="mb-3 text-sm font-semibold text-jardinerie-text/80">Prix</h3>
            <button onClick={resetPrice} className="text-xs text-gray-500 hover:text-gray-700">
              Réinitialiser
            </button>
          </div>

          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">Min</label>
              <label className="text-xs text-gray-500">Max</label>
            </div>
            <div className="mt-2 flex items-center space-x-3">
              <input
                type="number" min={MIN} max={MAX} value={priceMin}
                onChange={(e) => handleMinInput(e.target.value)}
                onBlur={commitPriceChange}
                onKeyDown={(e) => e.key === 'Enter' && commitPriceChange()}
                className="w-24 rounded-md border border-gray-200 p-1 text-sm"
              />
              <div className="flex-1" />
              <input
                type="number" min={MIN} max={MAX} value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                onBlur={commitPriceChange}
                onKeyDown={(e) => e.key === 'Enter' && commitPriceChange()}
                className="w-24 rounded-md border border-gray-200 p-1 text-sm"
              />
            </div>

            <div className="relative mt-3 h-6">
              {/* Piste grise en arrière-plan */}
              <div className="pointer-events-none absolute left-0 right-0 top-2 h-2 rounded-full bg-gray-200" />
              
              {/* Ligne verte de progression colorée */}
              <div
                className="pointer-events-none absolute top-2 h-2 rounded-full bg-jardinerie-primary"
                style={{
                  left: `${((priceMin - MIN) / (MAX - MIN)) * 100}%`,
                  right: `${100 - ((priceMax - MIN) / (MAX - MIN)) * 100}%`,
                }}
              />
              
              {/* Curseurs de sélection (Inputs de type Range) */}
              <input
                type="range"
                min={MIN}
                max={MAX}
                value={priceMin}
                onChange={(e) => handleMinInput(e.target.value)}
                onMouseUp={commitPriceChange}
                onTouchEnd={commitPriceChange}
                // pointer-events-none ignore la piste / [&::-webkit...]-auto réactive uniquement le bouton
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                // Permet au curseur min de repasser au-dessus s'il est poussé vers la droite
                style={{ zIndex: priceMin > MAX * 0.5 ? 25 : 20 }}
              />
              <input
                type="range"
                min={MIN}
                max={MAX}
                value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                onMouseUp={commitPriceChange}
                onTouchEnd={commitPriceChange}
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                // Permet au curseur max de repasser au-dessus s'il est poussé vers la gauche
                style={{ zIndex: priceMin > MAX * 0.5 ? 20 : 25 }}
              />
            </div>

            <div className="mt-2 text-right text-xs text-gray-500">
              {priceMin === priceMax ? `${priceMin} €` : `${priceMin} € — ${priceMax} €`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}