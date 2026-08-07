import { useFormContext } from 'react-hook-form';

export default function BotanicalDataSection({ criteria = [] }) {
  const { register } = useFormContext();

  return (
    <section className="rounded-xl border border-jardinerie-primary/30 bg-jardinerie-bg/20 p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">🌿 Données botaniques</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom commun</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" {...register('plant.common_name')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom latin</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" {...register('plant.latin_name')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" {...register('plant.genus')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Espèce</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" {...register('plant.species')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exposition</label>
          <select className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" {...register('plant.sun_exposure')}>
            <option value="">-- Choisir --</option><option value="Sun">Plein soleil</option><option value="Partial Shade">Mi-ombre</option><option value="Shade">Ombre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Besoin en eau</label>
          <select className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" {...register('plant.water_requirement')}>
            <option value="">-- Choisir --</option><option value="Low">Faible</option><option value="Medium">Moyen</option><option value="High">Élevé</option>
          </select>
        </div>
      </div>
      <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Critères</label>
  <div className="flex flex-wrap gap-4">
    {criteria.map((crit) => (
      <label key={crit.id} className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          value={String(crit.id)}
          {...register('plant.criteria')}
          className="h-4 w-4 rounded border-gray-300 accent-jardinerie-primary"
        />
        {crit.label}
      </label>
    ))}
  </div>
</div>

    </section>
  );
}