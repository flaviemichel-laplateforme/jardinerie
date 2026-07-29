import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { useApi } from '../../hooks/useApi';
import { filterService } from '../../services/filterService';
import { adminService } from '../../services/adminService';
import { buildRequestOptions, resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// Import de nos composants modulaires
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
  secondary_image_url:     '',
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
  const watchDeptId = watch('department_id');

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [secondaryImagePreview, setSecondaryImagePreview] = useState(null);
  const [secondaryImageFile,    setSecondaryImageFile]    = useState(null);
  const [tree,  setTree]  = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [criteria, setCriteria] = useState([]);

  const { loading: loadingMeta,    request: requestMeta }    = useApi();
  const { loading: loadingProduct, request: requestProduct } = useApi();
  const { loading: uploading,      request: uploadRequest }  = useApi();
  const { loading: secondaryUploading, request: secondaryUploadRequest } = useApi();
  const { request: saveRequest } = useApi();

  // 1. Chargement des métadonnées (Catégories et Taxes)
  useEffect(() => {
    const loadMeta = async () => {
      const [catResult, taxResult, critResult] = await Promise.all([
        requestMeta(adminService.buildCategoriesUrl(), buildRequestOptions(), false),
        requestMeta(adminService.buildTaxesUrl(),      buildRequestOptions(), false),
        requestMeta(filterService.buildFiltersUrl(),      buildRequestOptions(), false),
      ]);
      if (catResult.success) setTree(catResult.data.tree);
      if (taxResult.success) setTaxes(taxResult.data.taxes);
      if (critResult.success) setCriteria(critResult.data.criteria);
    };
    loadMeta();
  }, [requestMeta]);

  // 2. Chargement du produit en mode Édition avec le "Détective"
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
      // Retrouver le Département et la Catégorie
      let foundDeptId = p.department_id || '';
      let foundCatId = p.category_id || '';

      if (!foundDeptId && !foundCatId && tree.length > 0) {
        for (const dept of tree) {
          for (const cat of dept.categories) {
            if (cat.subcategories.some(sub => String(sub.id) === String(p.subcategory_id))) {
              foundDeptId = dept.id;
              foundCatId = cat.id;
            }
          }
        }
      }

      reset({
        name:                    p.name ?? '',
        description:             p.description ?? '',
        price_tax_incl:          p.price_tax_incl ?? '',
        purchase_price_tax_incl: p.purchase_price_tax_incl ?? '',
        stock_quantity:          p.stock_quantity ?? 0,
        tax_id:                  p.tax_id ?? '',
        subcategory_id:          p.subcategory_id ?? '',
        department_id:           foundDeptId, 
        category_id:             foundCatId,  
        is_active:               parseInt(p.is_active) === 1,
        main_image_url:          p.main_image_url ?? '',
        secondary_image_url:     p.secondary_image_url ?? '',
        plant: {
          common_name:       p.common_name ?? '',
          latin_name:        p.latin_name ?? '',
          genus:             p.genus ?? '',
          species:           p.species ?? '',
          sun_exposure:      p.sun_exposure ?? '',
          water_requirement: p.water_requirement ?? '',
          criteria:          (p.criteria_ids ?? []).map(String),
        },
      });

      if (p.main_image_url) setImagePreview(resolveAssetUrl(p.main_image_url));
      if (p.secondary_image_url) setSecondaryImagePreview(resolveAssetUrl(p.secondary_image_url));
    };

    // On attend que l'arbre soit chargé avant de lancer le détective
    if (tree.length > 0) {
      loadProduct();
    }
  }, [id, isEditing, requestProduct, navigate, reset, tree]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCategoryCreated  = (departmentId, newCategory) => {
    setTree((prevTree) =>
      prevTree.map((dept) =>
        String(dept.id) === String(departmentId)
          ? { ...dept, categories: [...dept.categories, newCategory] }
          : dept
      )
    );
  };

  const handleSubcategoryCreated = (categoryId, newSubcategory) => {
    setTree((prevTree) =>
      prevTree.map((dept) => ({
        ...dept,
        categories: dept.categories.map((cat) =>
          String(cat.id) === String(categoryId)
            ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
            : cat
        ),
      }))
    );
  };


  const handleSecondaryImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSecondaryImageFile(file);
    setSecondaryImagePreview(URL.createObjectURL(file));
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

  const uploadSecondaryImage = async () => {
    if (!secondaryImageFile) return null;
    const formData = new FormData();
    formData.append('image', secondaryImageFile);

    const result = await secondaryUploadRequest(
      adminService.buildUploadUrl(),
      { method: 'POST', credentials: 'include', body: formData },
      false
    );
    return result.success ? result.data.url : null;
  };

  const onSubmit = async (data) => {
    const [imageUrl, secondaryImageUrl] = await Promise.all([
      uploadImage(),
      uploadSecondaryImage(),
    ]);

    const payload = {
      ...data,
      is_active: data.is_active ? 1 : 0,
      main_image_url: imageUrl || data.main_image_url,
      secondary_image_url: secondaryImageUrl || data.secondary_image_url,
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

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <GeneralInfoSection />
          <CategoryCascadeSection 
            tree={tree}
            onCategoryCreated={handleCategoryCreated}
            onSubcategoryCreated={handleSubcategoryCreated}
            />
          <PriceAndStockSection taxes={taxes} />
          <ImageUploadSection
            imagePreview={imagePreview}
            placeholderImg={placeholderImg}
            handleImageChange={handleImageChange}
            uploading={uploading}
            secondaryImagePreview={secondaryImagePreview}
            handleSecondaryImageChange={handleSecondaryImageChange}
            secondaryUploading={secondaryUploading}
          />

          {String(watchDeptId) === '1' && <BotanicalDataSection criteria={criteria} />}

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