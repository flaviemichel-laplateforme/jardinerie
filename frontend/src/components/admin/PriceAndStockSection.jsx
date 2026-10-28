import { useFormContext } from 'react-hook-form';
import { PRODUCT_LIMITS } from '../../constants/productLimits';

// 9999.99 -> « 9 999,99 € » (le formatEuro du panier n'ajoute pas de séparateur de milliers)
const formatAmount = (amount) =>
  `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const priceRange = (min) => `${formatAmount(min)} et ${formatAmount(PRODUCT_LIMITS.PRICE_MAX)}`;

export default function PriceAndStockSection({ taxes }) {
  const { register, formState: { errors } } = useFormContext();

  const inputClass = 'w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">Prix & Stock</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">
            Prix vente TTC <span className="text-red-500">*</span>
          </label>
          <input
            id="product-price"
            type="number" inputMode="decimal" step="0.01"
            min={PRODUCT_LIMITS.PRICE_MIN} max={PRODUCT_LIMITS.PRICE_MAX}
            aria-invalid={errors.price_tax_incl ? 'true' : 'false'}
            aria-describedby="product-price-hint"
            className={inputClass}
            {...register('price_tax_incl', {
              required: 'Le prix est obligatoire',
              valueAsNumber: true,
              validate: (value) =>
                (value >= PRODUCT_LIMITS.PRICE_MIN && value <= PRODUCT_LIMITS.PRICE_MAX) ||
                `Le prix doit être compris entre ${priceRange(PRODUCT_LIMITS.PRICE_MIN)}.`,
            })}
          />
          <p id="product-price-hint" className="mt-1 text-xs text-gray-500">
            De {formatAmount(PRODUCT_LIMITS.PRICE_MIN)} à {formatAmount(PRODUCT_LIMITS.PRICE_MAX)}
          </p>
          {errors.price_tax_incl && <p role="alert" className="mt-1 text-xs text-red-500">{errors.price_tax_incl.message}</p>}
        </div>

        <div>
          <label htmlFor="product-purchase-price" className="block text-sm font-medium text-gray-700 mb-1">Prix achat HT</label>
          <input
            id="product-purchase-price"
            type="number" inputMode="decimal" step="0.01"
            min="0" max={PRODUCT_LIMITS.PRICE_MAX}
            aria-invalid={errors.purchase_price_tax_incl ? 'true' : 'false'}
            className={inputClass}
            {...register('purchase_price_tax_incl', {
              valueAsNumber: true,
              // Facultatif : un champ vide donne NaN et n'est pas vérifié
              validate: (value) =>
                Number.isNaN(value) ||
                (value >= 0 && value <= PRODUCT_LIMITS.PRICE_MAX) ||
                `Le prix d'achat doit être compris entre ${priceRange(0)}.`,
            })}
          />
          {errors.purchase_price_tax_incl && <p role="alert" className="mt-1 text-xs text-red-500">{errors.purchase_price_tax_incl.message}</p>}
        </div>

        <div>
          <label htmlFor="product-tax" className="block text-sm font-medium text-gray-700 mb-1">
            Taux TVA <span className="text-red-500">*</span>
          </label>
          <select
            id="product-tax"
            className={inputClass}
            {...register('tax_id', { required: "Requis", valueAsNumber: true })}
          >
            <option value="">-- Choisir --</option>
            {taxes.map(t => <option key={t.id} value={t.id}>{t.rate} %</option>)}
          </select>
          {errors.tax_id && <p role="alert" className="mt-1 text-xs text-red-500">{errors.tax_id.message}</p>}
        </div>

        <div>
          <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            id="product-stock"
            type="number" inputMode="numeric" step="1"
            min="0" max={PRODUCT_LIMITS.STOCK_MAX}
            aria-invalid={errors.stock_quantity ? 'true' : 'false'}
            aria-describedby="product-stock-hint"
            className={inputClass}
            {...register('stock_quantity', {
              required: 'Le stock est obligatoire',
              valueAsNumber: true,
              validate: (value) =>
                (Number.isInteger(value) && value >= 0 && value <= PRODUCT_LIMITS.STOCK_MAX) ||
                `Le stock doit être un entier compris entre 0 et ${PRODUCT_LIMITS.STOCK_MAX.toLocaleString('fr-FR')}.`,
            })}
          />
          <p id="product-stock-hint" className="mt-1 text-xs text-gray-500">
            De 0 à {PRODUCT_LIMITS.STOCK_MAX.toLocaleString('fr-FR')}
          </p>
          {errors.stock_quantity && <p role="alert" className="mt-1 text-xs text-red-500">{errors.stock_quantity.message}</p>}
        </div>
      </div>
    </section>
  );
}
