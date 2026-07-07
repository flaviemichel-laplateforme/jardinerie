import { useFormContext } from 'react-hook-form';

export default function GeneralInfoSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">Informations générales</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            {...register('name', { required: "Le nom est obligatoire" })}
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <input
            type="checkbox"
            id="is_active"
            className="h-5 w-5 rounded border-gray-300 text-jardinerie-primary focus:ring-jardinerie-primary"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Produit en ligne (visible dans le catalogue)
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
          {...register('description')}
        />
      </div>
    </section>
  );
}