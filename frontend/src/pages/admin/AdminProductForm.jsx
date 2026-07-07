import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form'; // 1. L'import magique
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { adminService } from '../../services/adminService';

// ... (votre emptyForm reste exactement le même)

export default function AdminProductForm() {
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
  const { id } = useParams();
  const isEditing = !!id;

  // 2. Initialisation de React Hook Form
  const {
    register,         // Remplace "name", "value" et "onChange" sur vos inputs
    handleSubmit,     // Intercepte la soumission et bloque si des erreurs sont présentes
    formState: { errors, isSubmitting }, // Gère les erreurs et l'état de chargement
    setValue,         // Nous servira plus tard pour remplir le formulaire en mode Édition
    watch             // Nous servira à écouter la catégorie (pour afficher la section botanique)
  } = useForm({
    defaultValues: emptyForm // On passe les valeurs par défaut ici !
  });

  // (Vos états pour l'image et l'arbre des catégories restent ici, car ils ne font pas partie du texte)
  // const [imagePreview, setImagePreview] = useState(null);
  // ...

  // 3. La nouvelle fonction de soumission
  // RHF ne déclenche cette fonction QUE si toutes les règles de validation sont respectées
  const onSubmit = async (data) => {
    console.log("Données validées et prêtes pour l'API PHP :", data);
    
    // Nous placerons ici l'upload d'image et le request API...
  };

 return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* EXEMPLE DE TRANSFORMATION D'UN CHAMP */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du produit <span className="text-red-500">*</span>
        </label>
        
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          {...register('name', { 
            required: "Le nom du produit est obligatoire",
            minLength: { value: 3, message: "Le nom doit faire au moins 3 caractères" }
          })}
        />
        
        {/* Affichage conditionnel de l'erreur géré 100% automatiquement par RHF */}
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Le bouton profite automatiquement de l'état isSubmitting */}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="rounded-full bg-jardinerie-primary px-8 py-3 text-white font-bold"
      >
        {isSubmitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer le produit')}
      </button>

    </form>
  );
}