import { useFormContext } from 'react-hook-form';

export default function PriceAndStockSection({ taxes }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">Prix & Stock</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix vente TTC <span className="text-red-500">*</span>
          </label>
          <input
            type="number" step="0.01" min="0"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
            {...register('price_tax_incl', { required: "Requis", valueAsNumber: true })}
          />
          {errors.price_tax_incl && <p className="mt-1 text-xs text-red-500">{errors.price_tax_incl.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prix achat HT</label>
          <input
            type="number" step="0.01" min="0"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
            {...register('purchase_price_tax_incl', { valueAsNumber: true })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taux TVA <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none" 
            {...register('tax_id', { required: "Requis", valueAsNumber: true })}
          >
            <option value="">-- Choisir --</option>
            {taxes.map(t => <option key={t.id} value={t.id}>{t.rate} %</option>)}
          </select>
          {errors.tax_id && <p className="mt-1 text-xs text-red-500">{errors.tax_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="0"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
            {...register('stock_quantity', { required: "Requis", valueAsNumber: true })}
          />
          {errors.stock_quantity && <p className="mt-1 text-xs text-red-500">{errors.stock_quantity.message}</p>}
        </div>
      </div>
    </section>
  );
}