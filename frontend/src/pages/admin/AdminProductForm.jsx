import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions, resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// ==========================================
// 1. FORMULAIRE VIDE PAR DÉFAUT
// ==========================================
const emptyForm = {
  name:                    '',
  description:             '',
  price_tax_incl:          '',
  purchase_price_tax_incl: '',
  stock_quantity:          0,
  tax_id:                  '',
  department_id:           '', // Ajouté pour la gestion de la cascade Front
  category_id:             '', // Ajouté pour la gestion de la cascade Front
  subcategory_id:          '',
  is_active:               true, // RHF gère mieux les booléens purs pour les checkbox
  main_image_url:          '',
  plant: {
    common_name:       '',
    latin_name:        '',
    genus:             '',
    species:           '',
    sun_exposure:      '',
    water_requirement: '',
  },
};

export default function AdminProductForm() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isEditing   = !!id;

  // ==========================================
  // 2. INITIALISATION DE REACT HOOK FORM
  // ==========================================
  const {
    register,
    handleSubmit,
    reset, // Permet de pré-remplir le formulaire quand on charge un produit existant
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: emptyForm
  });

  // Les Radars : on écoute les identifiants sélectionnés en temps réel
  const watchDeptId = watch('department_id');
  const watchCatId  = watch('category_id');

  // ==========================================
  // 3. ÉTATS LOCAUX (Images & Méta-données)
  // ==========================================
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [tree,  setTree]  = useState([]);
  const [taxes, setTaxes] = useState([]);

  const { loading: loadingMeta,    request: requestMeta }    = useApi();
  const { loading: loadingProduct, request: requestProduct } = useApi();
  const { loading: uploading,      request: uploadRequest }  = useApi();
  const { request: saveRequest } = useApi(); // isSubmitting de RHF remplace le loading

  // ==========================================
  // 4. CHARGEMENT DES DONNÉES (API)
  // ==========================================
  useEffect(() => {
    const loadMeta = async () => {
      const [catResult, taxResult] = await Promise.all([
        requestMeta(adminService.buildCategoriesUrl(), buildRequestOptions(), false),
        requestMeta(adminService.buildTaxesUrl(),      buildRequestOptions(), false),
      ]);
      if (catResult.success) setTree(catResult.data.tree);
      if (taxResult.success) setTaxes(taxResult.data.taxes);
    };
    loadMeta();
  }, [requestMeta]);

  useEffect(() => {
    if (!isEditing) return;

    const loadProduct = async () => {
      const result = await requestProduct(
        adminService.buildProductUrl(id),
        buildRequestOptions(),
        false
      );

      if (!result.success) {
        toast.error('Produit introuvable.');
        navigate('/admin/catalogue');
        return;
      }

      const p = result.data.product;

      // Hydratation du formulaire RHF
      reset({
        name:                    p.name ?? '',
        description:             p.description ?? '',
        price_tax_incl:          p.price_tax_incl ?? '',
        purchase_price_tax_incl: p.purchase_price_tax_incl ?? '',
        stock_quantity:          p.stock_quantity ?? 0,
        tax_id:                  p.tax_id ?? '',
        subcategory_id:          p.subcategory_id ?? '',
        is_active:               p.is_active === 1, // Conversion en booléen
        main_image_url:          p.main_image_url ?? '',
        plant: {
          common_name:       p.common_name ?? '',
          latin_name:        p.latin_name ?? '',
          genus:             p.genus ?? '',
          species:           p.species ?? '',
          sun_exposure:      p.sun_exposure ?? '',
          water_requirement: p.water_requirement ?? '',
        },
      });

      if (p.main_image_url) setImagePreview(resolveAssetUrl(p.main_image_url));
    };

    loadProduct();
  }, [id, isEditing, requestProduct, navigate, reset]);


  // ==========================================
  // 5. LOGIQUE MÉTIER & CASCADE
  // ==========================================
  
  // Calcul dynamique des catégories et sous-catégories basées sur les radars
  const selectedDept  = tree.find(d => String(d.id) === String(watchDeptId));
  const categories    = selectedDept?.categories ?? [];
  const selectedCat   = categories.find(c => String(c.id) === String(watchCatId));
  const subcategories = selectedCat?.subcategories ?? [];

  // Upload d'image (Inchangé)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return null; // Sera géré dans le submit
    const formData = new FormData();
    formData.append('image', imageFile);

    const result = await uploadRequest(
      adminService.buildUploadUrl(),
      { method: 'POST', credentials: 'include', body: formData },
      false
    );
    return result.success ? result.data.url : null;
  };

  // ==========================================
  // 6. SOUMISSION DU FORMULAIRE
  // ==========================================
  const onSubmit = async (data) => {
    const imageUrl = await uploadImage();

    const payload = {
      ...data,
      is_active: data.is_active ? 1 : 0, // Re-conversion pour MySQL
      main_image_url: imageUrl || data.main_image_url,
      plant: watchDeptId === '1' ? data.plant : undefined, // Envoyé que si c'est un végétal
    };

    const url    = isEditing ? adminService.buildProductUrl(id) : adminService.buildProductsUrl();
    const method = isEditing ? 'PATCH' : 'POST';

    const result = await saveRequest(
      url,
      buildRequestOptions({ method, body: payload }),
      false
    );

    if (result.success) {
      toast.success(isEditing ? 'Produit mis à jour !' : 'Produit créé !');
      navigate('/admin/catalogue');
    } else {
      toast.error(result.message ?? 'Une erreur est survenue.');
    }
  };


  // ==========================================
  // 7. RENDU DU COMPOSANT
  // ==========================================
  if (loadingMeta || (isEditing && loadingProduct)) {
    return <Spinner message="Chargement du formulaire..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jardinerie-text">
          {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        </h1>
        <Link
          to="/admin/catalogue"
          className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ← Retour au catalogue
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section : Informations générales ── */}
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

        {/* ── Section : Catégorie (cascade) ── */}
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
                {tree.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
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
                  onChange: () => {
                    setValue('subcategory_id', '');
                  }
                })}
              >
                <option value="">-- Choisir --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.subcategory_id && <p className="mt-1 text-sm text-red-500">{errors.subcategory_id.message}</p>}
            </div>

          </div>
        </section>

        {/* ── Section : Prix & Stock ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-jardinerie-text">Prix & Stock</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix vente TTC <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01" min="0"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                {...register('price_tax_incl', { required: "Requis", valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix achat HT</label>
              <input
                type="number"
                step="0.01" min="0"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                {...register('purchase_price_tax_incl', { valueAsNumber: true})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux TVA <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                {...register('tax_id', { required: "Requis" })}
              >
                <option value="">-- Choisir --</option>
                {taxes.map(t => (
                  <option key={t.id} value={t.id}>{t.rate} %</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                {...register('stock_quantity', { required: "Requis", valueAsNumber:true })}
              />
            </div>
          </div>
        </section>

        {/* ── Section : Image ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-jardinerie-text">Image principale</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0">
              <img
                src={imagePreview || placeholderImg}
                alt="Aperçu"
                className="h-32 w-32 rounded-xl object-cover border border-gray-200"
              />
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-sm font-medium text-gray-700">Choisir une image (JPG, PNG, WebP)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-jardinerie-bg file:px-4 file:py-2 file:text-sm file:font-medium file:text-jardinerie-primary hover:file:bg-jardinerie-primary hover:file:text-white"
              />
              {uploading && <p className="text-xs text-jardinerie-primary animate-pulse">Upload en cours...</p>}
            </div>
          </div>
        </section>

        {/* ── Section : Données botaniques (Conditionnelle) ── */}
        {/* On affiche cette section SI le département sélectionné est 1 (Végétaux) */}
        {String(watchDeptId) === '1' && (
          <section className="rounded-xl border border-jardinerie-primary/30 bg-jardinerie-bg/20 p-6 space-y-4">
            <h2 className="text-base font-bold text-jardinerie-text">🌿 Données botaniques</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom commun</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                  {...register('plant.common_name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom latin</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                  {...register('plant.latin_name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                  {...register('plant.genus')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espèce</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                  {...register('plant.species')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exposition</label>
                <select className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" {...register('plant.sun_exposure')}>
                  <option value="">-- Choisir --</option>
                  <option value="Sun">Plein soleil</option>
                  <option value="Partial Shade">Mi-ombre</option>
                  <option value="Shade">Ombre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Besoin en eau</label>
                <select className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" {...register('plant.water_requirement')}>
                  <option value="">-- Choisir --</option>
                  <option value="Low">Faible</option>
                  <option value="Medium">Moyen</option>
                  <option value="High">Élevé</option>
                </select>
              </div>

            </div>
          </section>
        )}

        {/* ── Boutons ── */}
        <div className="flex gap-3 justify-end pb-8">
          <Link
            to="/admin/catalogue"
            className="rounded-full border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le produit'}
          </button>
        </div>

      </form>
    </div>
  );
}