import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions, resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// Import de nos nouveaux composants modulaires
import GeneralInfoSection from '../../components/admin/GeneralInfoSection';
import CategoryCascadeSection from '../../components/admin/CategoryCascadeSection';
import PriceAndStockSection from '../../components/admin/PriceAndStockSection';
import BotanicalDataSection from '../../components/admin/BotanicalDataSection';
import ImageUploadSection from '../../components/admin/ImageUploadSection';

const emptyForm = {
  name:                    '',
  description:             '',
  price_tax_incl:          '',
  purchase_price_tax_incl: '',
  stock_quantity:          0,
  tax_id:                  '',
  department_id:           '', 
  category_id:             '', 
  subcategory_id:          '',
  is_active:               true, 
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

  const methods = useForm({
    defaultValues: emptyForm
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting } } = methods;
  const watchDeptId = watch('department_id'); // Pour l'affichage conditionnel Botanique

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [tree,  setTree]  = useState([]);
  const [taxes, setTaxes] = useState([]);

  const { loading: loadingMeta,    request: requestMeta }    = useApi();
  const { loading: loadingProduct, request: requestProduct } = useApi();
  const { loading: uploading,      request: uploadRequest }  = useApi();
  const { request: saveRequest } = useApi();

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

      reset({
        name:                    p.name ?? '',
        description:             p.description ?? '',
        price_tax_incl:          p.price_tax_incl ?? '',
        purchase_price_tax_incl: p.purchase_price_tax_incl ?? '',
        stock_quantity:          p.stock_quantity ?? 0,
        tax_id:                  p.tax_id ?? '',
        subcategory_id:          p.subcategory_id ?? '',
        department_id:           p.department_id ?? '', // Ajouté si présent dans votre API
        category_id:             p.category_id ?? '',   // Ajouté si présent dans votre API
        is_active:               p.is_active === 1,
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('image', imageFile);

    const result = await uploadRequest(
      adminService.buildUploadUrl(),
      { method: 'POST', credentials: 'include', body: formData },
      false
    );
    return result.success ? result.data.url : null;
  };

  const onSubmit = async (data) => {
    const imageUrl = await uploadImage();

    const payload = {
      ...data,
      is_active: data.is_active ? 1 : 0,
      main_image_url: imageUrl || data.main_image_url,
      plant: String(watchDeptId) === '1' ? data.plant : undefined,
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

  if (loadingMeta || (isEditing && loadingProduct)) {
    return <Spinner message="Chargement du formulaire..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-jardinerie-text">
          {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        </h1>
        <Link to="/admin/catalogue" className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          ← Retour au catalogue
        </Link>
      </div>

      {/* Le FormProvider enveloppe le formulaire et diffuse les pouvoirs de RHF aux composants enfants */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <GeneralInfoSection />
          
          <CategoryCascadeSection tree={tree} />
          
          <PriceAndStockSection taxes={taxes} />
          
          <ImageUploadSection 
            imagePreview={imagePreview} 
            placeholderImg={placeholderImg} 
            handleImageChange={handleImageChange} 
            uploading={uploading} 
          />

          {/* Affichage conditionnel de la section Botanique géré par le parent */}
          {String(watchDeptId) === '1' && <BotanicalDataSection />}

          {/* Boutons d'action */}
          <div className="flex gap-3 justify-end pb-8">
            <Link to="/admin/catalogue" className="rounded-full border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Annuler
            </Link>
            <button type="submit" disabled={isSubmitting || uploading} className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
              {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le produit'}
            </button>
          </div>

        </form>
      </FormProvider>
    </div>
  );
}