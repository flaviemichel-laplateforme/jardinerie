import { useFormContext, useWatch } from 'react-hook-form';
import { PRODUCT_LIMITS } from '../../constants/productLimits';

export default function GeneralInfoSection() {
  const { register, control, formState: { errors } } = useFormContext();

  // Longueur du nom, comptée comme le fait l'API : sans les espaces autour
  const name = useWatch({ control, name: 'name' }) ?? '';
  const nameLength = String(name).trim().length;
  const isTooLong = nameLength > PRODUCT_LIMITS.NAME_MAX_LENGTH;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">Informations générales</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby="product-name-count"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            {...register('name', {
              required: "Le nom est obligatoire",
              validate: {
                notBlank: (value) => String(value).trim().length > 0 || "Le nom est obligatoire",
                maxLength: (value) =>
                  String(value).trim().length <= PRODUCT_LIMITS.NAME_MAX_LENGTH ||
                  `Le nom ne peut pas dépasser ${PRODUCT_LIMITS.NAME_MAX_LENGTH} caractères.`,
              },
            })}
          />
          {/* Compteur : la limite est visible avant d'être dépassée */}
          <p
            id="product-name-count"
            className={`mt-1 text-xs ${isTooLong ? 'font-medium text-red-600' : 'text-gray-500'}`}
          >
            {nameLength} / {PRODUCT_LIMITS.NAME_MAX_LENGTH} caractères
          </p>
          {errors.name && <p role="alert" className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <input
            type="checkbox"
            id="is_active"
            className="h-5 w-5 rounded border-gray-300 accent-jardinerie-primary focus:ring-jardinerie-primary"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Produit en ligne (visible dans le catalogue)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="product-description"
          rows={3}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
          {...register('description')}
        />
      </div>
    </section>
  );
}
