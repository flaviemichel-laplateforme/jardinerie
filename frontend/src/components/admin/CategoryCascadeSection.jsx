import { useFormContext } from 'react-hook-form';

export default function CategoryCascadeSection({ tree }) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  const watchDeptId = watch('department_id');
  const watchCatId  = watch('category_id');

  const selectedDept  = tree.find(d => String(d.id) === String(watchDeptId));
  const categories    = selectedDept?.categories ?? [];
  const selectedCat   = categories.find(c => String(c.id) === String(watchCatId));
  const subcategories = selectedCat?.subcategories ?? [];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">Catégorie</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Département <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
            {...register('department_id', { 
              required: "Le département est requis",
              onChange: () => {
                setValue('category_id', '');
                setValue('subcategory_id', '');
              }
            })}
          >
            <option value="">-- Choisir --</option>
            {tree.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {errors.department_id && <p className="mt-1 text-sm text-red-500">{errors.department_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            disabled={!watchDeptId}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none disabled:opacity-50"
            {...register('category_id', { 
              required: "La catégorie est requise",
              onChange: () => setValue('subcategory_id', '')
            })}
          >
            <option value="">-- Choisir --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className="mt-1 text-sm text-red-500">{errors.category_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sous-catégorie <span className="text-red-500">*</span>
          </label>
          <select
            disabled={!watchCatId}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none disabled:opacity-50"
            {...register('subcategory_id', { required: "La sous-catégorie est requise" })}
          >
            <option value="">-- Choisir --</option>
            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.subcategory_id && <p className="mt-1 text-sm text-red-500">{errors.subcategory_id.message}</p>}
        </div>
      </div>
    </section>
  );
}