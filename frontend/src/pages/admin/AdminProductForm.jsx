import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';
import { buildRequestOptions, resolveAssetUrl } from '../../services/apiClient';
import placeholderImg from '../../assets/img/placeholder-vegetaux.png';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// Formulaire vide par défaut
const emptyForm = {
  name:                    '',
  description:             '',
  price_tax_incl:          '',
  purchase_price_tax_incl: '',
  stock_quantity:          0,
  tax_id:                  '',
  subcategory_id:          '',
  is_active:               1,
  main_image_url:          '',
  // Données botaniques
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
  const { id }      = useParams(); // undefined = création, sinon = édition
  const navigate    = useNavigate();
  const isEditing   = !!id;

  const [form,         setForm]         = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [showPlant,    setShowPlant]    = useState(false);

  // Données pour les selects en cascade
  const [tree,  setTree]  = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Cascade département → catégories → sous-catégories filtrées
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCatId,  setSelectedCatId]  = useState('');

  const { loading: loadingMeta, request: requestMeta } = useApi();
  const { loading: loadingProduct, request: requestProduct } = useApi();
  const { loading: saving, request: saveRequest } = useApi();
  const { loading: uploading, request: uploadRequest } = useApi();

  // Charger l'arbre catégories + taxes au montage
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

  // En mode édition : charger le produit existant
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

      setForm({
        name:                    p.name                    ?? '',
        description:             p.description             ?? '',
        price_tax_incl:          p.price_tax_incl          ?? '',
        purchase_price_tax_incl: p.purchase_price_tax_incl ?? '',
        stock_quantity:          p.stock_quantity           ?? 0,
        tax_id:                  p.tax_id                  ?? '',
        subcategory_id:          p.subcategory_id          ?? '',
        is_active:               p.is_active               ?? 1,
        main_image_url:          p.main_image_url          ?? '',
        plant: {
          common_name:       p.common_name       ?? '',
          latin_name:        p.latin_name        ?? '',
          genus:             p.genus             ?? '',
          species:           p.species           ?? '',
          sun_exposure:      p.sun_exposure      ?? '',
          water_requirement: p.water_requirement ?? '',
        },
      });

      if (p.main_image_url) setImagePreview(resolveAssetUrl(p.main_image_url));
      if (p.plant_id)       setShowPlant(true);
    };

    loadProduct();
  }, [id, isEditing, requestProduct, navigate]);

  // Handlers cascade
  const handleDeptChange = (e) => {
    setSelectedDeptId(e.target.value);
    setSelectedCatId('');
    setForm(prev => ({ ...prev, subcategory_id: '' }));
    // Afficher la section botanique uniquement pour le département Végétaux (id=1)
    setShowPlant(e.target.value === '1');
  };

  const handleCatChange = (e) => {
    setSelectedCatId(e.target.value);
    setForm(prev => ({ ...prev, subcategory_id: '' }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  const handlePlantChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      plant: { ...prev.plant, [name]: value },
    }));
  };

  // Upload image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // Aperçu immédiat local
  };

  const uploadImage = async () => {
    if (!imageFile) return form.main_image_url || null;

    const formData = new FormData();
    formData.append('image', imageFile);

    const result = await uploadRequest(
      adminService.buildUploadUrl(),
      {
        method:      'POST',
        credentials: 'include',
        body:        formData,
        // Pas de Content-Type manuel — le navigateur le génère avec le boundary
      },
      false
    );

    return result.success ? result.data.url : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Uploader l'image si un nouveau fichier a été sélectionné
    const imageUrl = await uploadImage();

    // 2. Préparer le payload
    const payload = {
      ...form,
      main_image_url: imageUrl,
      // N'envoyer les données botaniques que si le département est Végétaux
      plant: showPlant ? form.plant : undefined,
    };

    // 3. POST (création) ou PATCH (édition)
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

  // Données dérivées pour la cascade
  const selectedDept  = tree.find(d => String(d.id) === String(selectedDeptId));
  const categories    = selectedDept?.categories ?? [];
  const selectedCat   = categories.find(c => String(c.id) === String(selectedCatId));
  const subcategories = selectedCat?.subcategories ?? [];

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

      <form onSubmit={handleSubmit} className="space-y-6">

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
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
              />
            </div>

            {/* Toggle En ligne / Brouillon */}
            <div className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active === 1}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-jardinerie-primary focus:ring-jardinerie-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Produit en ligne (visible dans le catalogue)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none focus:ring-1 focus:ring-jardinerie-primary"
            />
          </div>
        </section>

        {/* ── Section : Catégorie (cascade) ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-jardinerie-text">Catégorie</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Département */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDeptId}
                onChange={handleDeptChange}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
              >
                <option value="">-- Choisir --</option>
                {tree.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCatId}
                onChange={handleCatChange}
                disabled={!selectedDeptId}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Choisir --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sous-catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sous-catégorie <span className="text-red-500">*</span>
              </label>
              <select
                name="subcategory_id"
                value={form.subcategory_id}
                onChange={handleChange}
                disabled={!selectedCatId}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">-- Choisir --</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Section : Prix & Stock ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-jardinerie-text">Prix & Stock</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix de vente TTC (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price_tax_incl"
                value={form.price_tax_incl}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix d'achat HT (€)
              </label>
              <input
                type="number"
                name="purchase_price_tax_incl"
                value={form.purchase_price_tax_incl}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux de TVA <span className="text-red-500">*</span>
              </label>
              <select
                name="tax_id"
                value={form.tax_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
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
                name="stock_quantity"
                value={form.stock_quantity}
                onChange={handleChange}
                min="0"
                required
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ── Section : Image ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-jardinerie-text">Image principale</h2>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Aperçu */}
            <div className="shrink-0">
              <img
                src={imagePreview || placeholderImg}
                alt="Aperçu"
                className="h-32 w-32 rounded-xl object-cover border border-gray-200"
              />
            </div>

            {/* Input file */}
            <div className="flex-1 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Choisir une image (JPG, PNG, WebP — max 5 Mo)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-jardinerie-bg file:px-4 file:py-2 file:text-sm file:font-medium file:text-jardinerie-primary hover:file:bg-jardinerie-primary hover:file:text-white"
              />
              {uploading && (
                <p className="text-xs text-jardinerie-primary animate-pulse">
                  Upload en cours...
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Section : Données botaniques (Végétaux uniquement) ── */}
        {showPlant && (
          <section className="rounded-xl border border-jardinerie-primary/30 bg-jardinerie-bg/20 p-6 space-y-4">
            <h2 className="text-base font-bold text-jardinerie-text">
              🌿 Données botaniques
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom commun</label>
                <input
                  type="text"
                  name="common_name"
                  value={form.plant.common_name}
                  onChange={handlePlantChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom latin</label>
                <input
                  type="text"
                  name="latin_name"
                  value={form.plant.latin_name}
                  onChange={handlePlantChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                  type="text"
                  name="genus"
                  value={form.plant.genus}
                  onChange={handlePlantChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Espèce</label>
                <input
                  type="text"
                  name="species"
                  value={form.plant.species}
                  onChange={handlePlantChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exposition</label>
                <select
                  name="sun_exposure"
                  value={form.plant.sun_exposure}
                  onChange={handlePlantChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
                >
                  <option value="">-- Choisir --</option>
                  <option value="Sun">Plein soleil</option>
                  <option value="Partial Shade">Mi-ombre</option>
                  <option value="Shade">Ombre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Besoin en eau</label>
                <select
                  name="water_requirement"
                  value={form.plant.water_requirement}
                  onChange={handlePlantChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-jardinerie-primary focus:outline-none"
                >
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
            disabled={saving || uploading}
            className="rounded-full bg-jardinerie-primary px-8 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le produit'}
          </button>
        </div>

      </form>
    </div>
  );
}