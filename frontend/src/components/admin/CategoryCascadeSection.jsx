import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions } from '../../services/apiClient';


export default function CategoryCascadeSection({ tree, onCategoryCreated, onSubcategoryCreated}) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { loading: creatingCategory, request: createCategoryRequest } = useApi();

  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const { loading: creatingSubcategory, request: createSubcategoryRequest } = useApi();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const result = await createCategoryRequest(
      adminService.buildCategoriesUrl(),
      buildRequestOptions({ method: 'POST', body: { department_id: watchDeptId, name: newCategoryName.trim()}})
    );

    if (result.success) {
      onCategoryCreated(watchDeptId, { id: result.data.id, name: newCategoryName.trim(), subcategories: [] });
      setValue('category_id', result.data.id);
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }
  };

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim()) return;

    const result = await createSubcategoryRequest(
      adminService.buildSubcategoriesUrl(),
      buildRequestOptions({ method: 'POST', body: { category_id: watchCatId, name: newSubcategoryName.trim() } })
    );

    if (result.success) {
      onSubcategoryCreated(watchCatId, { id: result.data.id, name: newSubcategoryName.trim() });
      setValue('subcategory_id', result.data.id);
      setIsCreatingSubcategory(false);
      setNewSubcategoryName('');
    }
  };

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
            Rayon <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
            {...register('department_id', { 
              required: "Le rayon est requis",
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

          {isCreatingCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la nouvelle catégorie"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory}
                className="shrink-0 rounded-lg bg-jardinerie-primary px-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {creatingCategory ? '...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                  setValue('category_id', '');
                }}
                className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-600"
              >
                Annuler
              </button>
            </div>
          ) : (
            <select
              disabled={!watchDeptId}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none disabled:opacity-50"
              {...register('category_id', {
                required: "La catégorie est requise",
                onChange: (e) => {
                  if (e.target.value === '__create__') {
                    setIsCreatingCategory(true);
                  } else {
                    setValue('subcategory_id', '');
                  }
                }
              })}
            >
              <option value="">-- Choisir --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__create__">+ Créer une nouvelle catégorie</option>
            </select>
          )}

          {errors.category_id && <p className="mt-1 text-sm text-red-500">{errors.category_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sous-catégorie <span className="text-red-500">*</span>
          </label>

          {isCreatingSubcategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Nom de la nouvelle sous-catégorie"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateSubcategory}
                disabled={creatingSubcategory}
                className="shrink-0 rounded-lg bg-jardinerie-primary px-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {creatingSubcategory ? '...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSubcategory(false);
                  setNewSubcategoryName('');
                  setValue('subcategory_id', '');
                }}
                className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-600"
              >
                Annuler
              </button>
            </div>
          ) : (
            <select
              disabled={!watchCatId}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none disabled:opacity-50"
              {...register('subcategory_id', {
                required: "La sous-catégorie est requise",
                onChange: (e) => {
                  if (e.target.value === '__create__') {
                    setIsCreatingSubcategory(true);
                  }
                }
              })}
            >
              <option value="">-- Choisir --</option>
              {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="__create__">+ Créer une nouvelle sous-catégorie</option>
            </select>
          )}

          {errors.subcategory_id && <p className="mt-1 text-sm text-red-500">{errors.subcategory_id.message}</p>}
        </div>
      </div>
    </section>
  );
}