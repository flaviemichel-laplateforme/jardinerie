import { useState, useEffect, useRef } from 'react';

export default function FilterSidebar({ activeCategories = [], activeExpositions = [], activeWater = [], activePrice = { min: '', max: '' }, onFilterChange, onReset }) {
  
  const categories = [
    { id: '1', label: "Plantes d'intérieur" },
    { id: '2', label: "Plantes d'extérieur" },
    { id: '3', label: "Petits fruits" },
    { id: '4', label: "Bulbes" },
    { id: '5', label: "Plantes potagères & aromatiques" },
    { id: '6', label: "Plantes grimpantes" },
  ];

  const exposures = [
    { id: 'Sun', label: "Plein Soleil" },
    { id: 'Partial Shade', label: "Mi-ombre" },
    { id: 'Shade', label: "Ombre" },
  ];

   const water = [
    { id: 'Low', label: "Arrosage faible" },
    { id: 'Medium', label: "Arrosage moyen" },
    { id: 'High', label: "Arrosage élevé" },
  ];

  const handleCheckboxChange = (filterType, value) => {
    let currentList = [];
    if (filterType === 'categories') currentList = activeCategories;
    else if (filterType === 'expositions') currentList = activeExpositions;
    else if (filterType === 'water') currentList = activeWater;

    let newList;

    if ((currentList || []).includes(value)) {
      newList = currentList.filter(item => item !== value); // Retrait
    } else {
      newList = [...(currentList || []), value]; // Ajout
    }

    onFilterChange({
      categories: filterType === 'categories' ? newList : activeCategories,
      expositions: filterType === 'expositions' ? newList : activeExpositions,
      water: filterType === 'water' ? newList : activeWater,
    });
  };
  // --- Filtre prix (double slider + inputs) ---
  const MIN = 0;
  const MAX = 500;

  const [priceMin, setPriceMin] = useState(activePrice.min !== '' ? Number(activePrice.min) : MIN);
  const [priceMax, setPriceMax] = useState(activePrice.max !== '' ? Number(activePrice.max) : MAX);

  // debounce emission to avoid rapid URL updates while sliding
  const emitTimer = useRef(null);
  useEffect(() => {
    return () => {
      if (emitTimer.current) clearTimeout(emitTimer.current);
    };
  }, []);

  useEffect(() => {
    // sync local slider values with URL-driven activePrice
    const desiredMin = activePrice.min !== '' ? Number(activePrice.min) : MIN;
    const desiredMax = activePrice.max !== '' ? Number(activePrice.max) : MAX;
    const timers = [];
    if (priceMin !== desiredMin) timers.push(setTimeout(() => setPriceMin(desiredMin), 0));
    if (priceMax !== desiredMax) timers.push(setTimeout(() => setPriceMax(desiredMax), 0));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePrice.min, activePrice.max]);

  const emitPriceChangeDebounced = (minVal, maxVal) => {
    if (emitTimer.current) clearTimeout(emitTimer.current);
    emitTimer.current = setTimeout(() => {
      onFilterChange({
        categories: activeCategories,
        expositions: activeExpositions,
        water: activeWater,
        price: { min: String(minVal), max: String(maxVal) }
      });
      emitTimer.current = null;
    }, 300);
  };

  const handleMinInput = (v) => {
    const num = Number(v);
    const val = Number.isNaN(num) ? MIN : Math.min(Math.max(num, MIN), priceMax);
    setPriceMin(val);
    emitPriceChangeDebounced(val, priceMax);
  };

  const handleMaxInput = (v) => {
    const num = Number(v);
    const val = Number.isNaN(num) ? MAX : Math.max(Math.min(num, MAX), priceMin);
    setPriceMax(val);
    emitPriceChangeDebounced(priceMin, val);
  };

  const resetPrice = () => {
    setPriceMin(MIN);
    setPriceMax(MAX);
    if (emitTimer.current) clearTimeout(emitTimer.current);
    // emit immediate reset so URL clears quickly
    onFilterChange({
      categories: activeCategories,
      expositions: activeExpositions,
      water: activeWater,
      price: { min: '', max: '' }
    });
  };

  // Active thumb management so overlapping ranges can be dragged
  const [activeThumb, setActiveThumb] = useState(null); // 'min' | 'max' | null
  const trackRef = useRef(null);
  const pointerIdRef = useRef(null);
  const captureTargetRef = useRef(null);

  useEffect(() => {
    const clear = () => {
      // release pointer capture if any
      if (captureTargetRef.current && pointerIdRef.current && captureTargetRef.current.releasePointerCapture) {
        captureTargetRef.current.releasePointerCapture(pointerIdRef.current);
      }
      pointerIdRef.current = null;
      captureTargetRef.current = null;
      setActiveThumb(null);
    };
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointercancel', clear);
    window.addEventListener('mouseup', clear);
    window.addEventListener('touchend', clear);
    window.addEventListener('touchcancel', clear);
    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointercancel', clear);
      window.removeEventListener('mouseup', clear);
      window.removeEventListener('touchend', clear);
      window.removeEventListener('touchcancel', clear);
    };
  }, []);

  // When a thumb is active, follow pointer movements to update value continuously
  useEffect(() => {
    if (!activeThumb) return;

    const onPointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
      if (!trackRef.current || typeof clientX !== 'number') return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const value = Math.round(MIN + pct * (MAX - MIN));

      if (activeThumb === 'min') {
        const newMin = Math.min(value, priceMax);
        setPriceMin(newMin);
        emitPriceChangeDebounced(newMin, priceMax);
      } else if (activeThumb === 'max') {
        const newMax = Math.max(value, priceMin);
        setPriceMax(newMax);
        emitPriceChangeDebounced(priceMin, newMax);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThumb, priceMin, priceMax]);

  const handleTrackPointerDown = (e) => {
    // normalize clientX for mouse and touch
    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
    if (!trackRef.current || typeof clientX !== 'number') return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const value = Math.round(MIN + pct * (MAX - MIN));

    // choose nearest thumb
    const distMin = Math.abs(value - priceMin);
    const distMax = Math.abs(value - priceMax);
    if (distMin <= distMax) {
      setActiveThumb('min');
      setPriceMin(value);
      emitPriceChangeDebounced(value, priceMax);
    } else {
      setActiveThumb('max');
      setPriceMax(value);
      emitPriceChangeDebounced(priceMin, value);
    }

    // prevent text selection
    e.preventDefault && e.preventDefault();
  };

  const handleRangePointerDown = (e, which) => {
    setActiveThumb(which);
    pointerIdRef.current = e.pointerId;
    captureTargetRef.current = e.target;
    if (e.target && e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const hasActiveFilters = activeCategories.length > 0 || activeExpositions.length > 0 || activeWater.length > 0 || (activePrice && (activePrice.min !== '' || activePrice.max !== ''));

  return (
    <aside className="mb-8 w-full shrink-0 pr-0 md:mb-0 md:w-64 md:pr-6">
      <div className="rounded-2xl border border-jardinerie-primary/10 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="font-bold uppercase tracking-wider text-jardinerie-text">Filtres</h2>
          {hasActiveFilters && (
            <button 
              onClick={onReset}
              className="text-xs font-medium text-red-500 underline transition-colors hover:text-red-700"
            >
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
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-jardinerie-primary/50 focus:ring-2"
                  checked={activeCategories.includes(cat.id)}
                  onChange={() => handleCheckboxChange('categories', cat.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-jardinerie-text/80">Exposition</h3>
          <div className="flex flex-col space-y-2">
            {exposures.map((exp) => (
              <label key={exp.id} className="group flex cursor-pointer items-center space-x-3">
                <input 
                  type="checkbox" 
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-jardinerie-primary/50 focus:ring-2"
                  checked={activeExpositions.includes(exp.id)}
                  onChange={() => handleCheckboxChange('expositions', exp.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">
                  {exp.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-jardinerie-text/80">Besoins en eau</h3>
          <div className="flex flex-col space-y-2">
            {water.map((w) => (
              <label key={w.id} className="group flex cursor-pointer items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-jardinerie-primary/50 focus:ring-2"
                  checked={(activeWater || []).includes(w.id)}
                  onChange={() => handleCheckboxChange('water', w.id)}
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-jardinerie-primary">
                  {w.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="mb-3 text-sm font-semibold text-jardinerie-text/80">Prix</h3>
            <button onClick={resetPrice} className="text-xs text-gray-500 hover:text-gray-700">Réinitialiser</button>
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

            <div ref={trackRef} onPointerDown={handleTrackPointerDown} className="relative mt-3 h-6">
              <div className="absolute left-0 right-0 top-2 h-2 rounded-full bg-gray-200 pointer-events-none" />
              <div
                className="absolute top-2 h-2 rounded-full bg-jardinerie-primary pointer-events-none"
                style={{ left: `${((priceMin - MIN) / (MAX - MIN)) * 100}%`, right: `${100 - ((priceMax - MIN) / (MAX - MIN)) * 100}%` }}
              />

              <input
                type="range"
                min={MIN}
                max={MAX}
                value={priceMin}
                onChange={(e) => handleMinInput(e.target.value)}
                onPointerDown={(e) => handleRangePointerDown(e, 'min')}
                style={{ zIndex: activeThumb === 'min' ? 3 : 2 }}
                className="absolute left-0 right-0 top-0 h-6 w-full appearance-none bg-transparent"
              />
              <input
                type="range"
                min={MIN}
                max={MAX}
                value={priceMax}
                onChange={(e) => handleMaxInput(e.target.value)}
                onPointerDown={(e) => handleRangePointerDown(e, 'max')}
                style={{ zIndex: activeThumb === 'max' ? 3 : 1 }}
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