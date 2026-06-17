import { useEffect, useMemo, useState } from 'react';

export default function FilterSidebar({
  activeCategories = [],
  activeExpositions = [],
  activeWater = [],
  activePrice = { min: '', max: '' },
  onFilterChange,
  onReset,
}) {
  const categories = useMemo(
    () => [
      { id: '1', label: "Plantes d'intérieur" },
      { id: '2', label: 'Plantes d\'extérieur' },
      { id: '3', label: 'Petits fruits' },
      { id: '4', label: 'Bulbes' },
      { id: '5', label: 'Plantes potagères & aromatiques' },
      { id: '6', label: 'Plantes grimpantes' },
    ],
    []
  );

  const exposures = useMemo(
    () => [
      { id: 'Sun', label: 'Plein Soleil' },
      { id: 'Partial Shade', label: 'Mi-ombre' },
      { id: 'Shade', label: 'Ombre' },
    ],
    []
  );

  const water = useMemo(
    () => [
      { id: 'Low', label: 'Arrosage faible' },
      { id: 'Medium', label: 'Arrosage moyen' },
      { id: 'High', label: 'Arrosage élevé' },
    ],
    []
  );

  const MIN = 0;
  const MAX = 500;

  const [priceMin, setPriceMin] = useState(activePrice.min !== '' ? Number(activePrice.min) : MIN);
  const [priceMax, setPriceMax] = useState(activePrice.max !== '' ? Number(activePrice.max) : MAX);

  useEffect(() => {
    const desiredMin = activePrice.min !== '' ? Number(activePrice.min) : MIN;
    const desiredMax = activePrice.max !== '' ? Number(activePrice.max) : MAX;
    const timer = setTimeout(() => {
      setPriceMin(desiredMin);
      setPriceMax(desiredMax);
    }, 0);
    return () => clearTimeout(timer);
  }, [activePrice.min, activePrice.max]);

  const updateFilters = (patch) => {
    onFilterChange({
      categories: activeCategories,
      expositions: activeExpositions,
      water: activeWater,
      ...patch,
    });
  };

  const toggleValue = (list, value) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const handleCheckboxChange = (filterType, value) => {
    if (filterType === 'categories') {
      updateFilters({ categories: toggleValue(activeCategories, value) });
      return;
    }
    if (filterType === 'expositions') {
      updateFilters({ expositions: toggleValue(activeExpositions, value) });
      return;
    }
    if (filterType === 'water') {
      updateFilters({ water: toggleValue(activeWater, value) });
    }
  };

  const emitPriceChange = (minVal, maxVal) => {
    updateFilters({ price: { min: String(minVal), max: String(maxVal) } });
  };

  const handleMinInput = (value) => {
    const nextMin = Math.min(Math.max(Number(value) || MIN, MIN), priceMax);
    setPriceMin(nextMin);
    emitPriceChange(nextMin, priceMax);
  };

  const handleMaxInput = (value) => {
    const nextMax = Math.max(Math.min(Number(value) || MAX, MAX), priceMin);
    setPriceMax(nextMax);
    emitPriceChange(priceMin, nextMax);
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
            {categories.map((cat) => (
              <label key={cat.id} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-2 focus:ring-jardinerie-primary/50"
                  checked={activeCategories.includes(cat.id)}
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
                <path d="M12 2.5v2.2" />
                <path d="M12 19.3v2.2" />
                <path d="M2.5 12h2.2" />
                <path d="M19.3 12h2.2" />
                <path d="M5.1 5.1l1.6 1.6" />
                <path d="M17.3 17.3l1.6 1.6" />
                <path d="M5.1 18.9l1.6-1.6" />
                <path d="M17.3 6.7l1.6-1.6" />
              </g>
            </svg>
          </h3>
          <div className="flex flex-col space-y-2">
            {exposures.map((exp) => (
              <label key={exp.id} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-2 focus:ring-jardinerie-primary/50"
                  checked={activeExpositions.includes(exp.id)}
                  onChange={() => handleCheckboxChange('expositions', exp.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">{exp.label}</span>
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
            {water.map((w) => (
              <label key={w.id} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-2 focus:ring-jardinerie-primary/50"
                  checked={activeWater.includes(w.id)}
                  onChange={() => handleCheckboxChange('water', w.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">{w.label}</span>
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
                type="number"
                min={MIN}
                max={MAX}
                value={priceMin}
                onChange={(e) => handleMinInput(e.target.value)}
                className="w-24 rounded-md border border-gray-200 p-1 text-sm"
                aria-label="Prix minimum"
              />
              <div className="flex-1" />
              <input
                type="number"
                min={MIN}
                max={MAX}
                value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                className="w-24 rounded-md border border-gray-200 p-1 text-sm"
                aria-label="Prix maximum"
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
                type="range"
                min={MIN}
                max={MAX}
                value={priceMin}
                onChange={(e) => handleMinInput(e.target.value)}
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent"
              />
              <input
                type="range"
                min={MIN}
                max={MAX}
                value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent"
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