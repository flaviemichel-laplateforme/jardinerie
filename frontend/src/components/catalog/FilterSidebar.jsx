import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { filterService } from '../../services/filterService';

export default function FilterSidebar({
  activeCategories = [],
  activeExpositions = [],
  activeWater = [],
  activePrice = { min: '', max: '' },
  onFilterChange,
  onReset,
  mode = 'global', // 'vegetaux', 'jardinage', ou 'global'
}) {
  const { data: apiFilters, loading, error, request } = useApi();

  const MIN = 0;
  const MAX = 500;

  const [priceMin, setPriceMin] = useState(activePrice.min !== '' ? Number(activePrice.min) : MIN);
  const [priceMax, setPriceMax] = useState(activePrice.max !== '' ? Number(activePrice.max) : MAX);

  // ==========================================
  // LA CORRECTION EST ICI
  // ==========================================
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchSidebarFilters = async () => {
      const url = filterService.buildFiltersUrl(mode);
      
      // On encapsule l'appel dans une fonction asynchrone pour mieux gérer l'AbortController
      await request(url, { signal: controller.signal }, false);
    };

    fetchSidebarFilters();

    return () => {
      // Nettoyage uniquement si le composant est détruit ou si le 'mode' change
      controller.abort();
    };
    // On a retiré 'request' du tableau de dépendances. 
    // Ainsi, quand le parent se met à jour suite à un changement de prix, ce bloc n'est plus relancé.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Synchronisation si le parent force un nouveau prix (ex: bouton "effacer")
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

  if (error) {
    return (
      <aside className="mb-8 w-full shrink-0 pr-0 md:mb-0 md:w-64 md:pr-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          Impossible de charger les filtres pour le moment.
        </div>
      </aside>
    );
  }

  if (loading || !apiFilters) {
    return (
      <aside className="mb-8 w-full shrink-0 pr-0 md:mb-0 md:w-64 md:pr-6 h-96 animate-pulse bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Chargement des filtres...</span>
      </aside>
    );
  }

  const exposureOrder = ['Sun', 'Partial Shade', 'Shade'];
  const waterOrder = ['Low', 'Medium', 'High'];

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
    return dictionary[technicalValue] || technicalValue; 
  };

  const showBotanicalFilters = mode !== 'jardinage';

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
            {options.categories.length === 0 && (
               <span className="text-sm text-gray-400 italic">Aucune catégorie.</span>
            )}
          </div>
        </div>

        {showBotanicalFilters && (
          <>
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-jardinerie-text/80">
                Exposition
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

            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-jardinerie-text/80">
                Besoins en eau
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
          </>
        )}

        <div className="mt-6 border-t border-gray-100 pt-6">
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
                className="w-24 rounded-md border border-gray-200 p-1 text-sm bg-white"
              />
              <div className="flex-1" />
              <input
                type="number" min={MIN} max={MAX} value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                onBlur={commitPriceChange}
                onKeyDown={(e) => e.key === 'Enter' && commitPriceChange()}
                className="w-24 rounded-md border border-gray-200 p-1 text-sm bg-white"
              />
            </div>

            <div className="relative mt-3 h-6">
              <div className="pointer-events-none absolute left-0 right-0 top-2 h-2 rounded-full bg-gray-200" />
              
              <div
                className="pointer-events-none absolute top-2 h-2 rounded-full bg-jardinerie-primary"
                style={{
                  left: `${((priceMin - MIN) / (MAX - MIN)) * 100}%`,
                  right: `${100 - ((priceMax - MIN) / (MAX - MIN)) * 100}%`,
                }}
              />
              
              <input
                type="range" min={MIN} max={MAX} value={priceMin}
                onChange={(e) => handleMinInput(e.target.value)}
                onMouseUp={commitPriceChange}
                onTouchEnd={commitPriceChange}
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                style={{ zIndex: priceMin > MAX * 0.5 ? 25 : 20 }}
              />
              <input
                type="range" min={MIN} max={MAX} value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                onMouseUp={commitPriceChange}
                onTouchEnd={commitPriceChange}
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
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