import { notFound } from 'next/navigation';
import { Droplet } from 'lucide-react';
import { getProduct, getAllProducts } from '../../../services/productData';
import { resolveAssetUrl } from '../../../services/apiClient';
import { productPath } from '../../../utils/productUrl';
import { parseProductDescription } from '../../../utils/parseProductDescription';
import { SUN_EXPOSURE_CONFIG, WATER_REQUIREMENT_CONFIG, WATER_COLOR } from '../../../constants/plantAttributes';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import ProductGallery from '../../../components/catalog/ProductGallery';
import ProductDescription from '../../../components/catalog/ProductDescription';
import ProductBotanicalSheet from '../../../components/catalog/ProductBotanicalSheet';
import ProductBuyBox from '../../../components/catalog/ProductBuyBox';
import BackButton from '../../../components/catalog/BackButton';
import placeholderImg from '../../../assets/img/placeholder-vegetaux.png';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jardinerie.vercel.app';

/** "12-monstera-deliciosa" -> 12 ; null si l'adresse ne commence pas par un identifiant */
function productIdFromSlug(slug) {
  const match = /^(\d+)(?:-|$)/.exec(slug);
  const id = match ? Number(match[1]) : 0;
  return id > 0 ? id : null;
}

const slugOf = (product) => productPath(product).split('/').pop();

// Texte de présentation du produit, sur une ligne : l'introduction de la description (ou toute la description
// quand elle n'est pas découpée en sections)
function summaryOf(product) {
  const { intro, plain } = parseProductDescription(product.description, product.latin_name);
  return (intro || plain).replace(/\s+/g, ' ').trim();
}

// Texte ramené à ~155 caractères (longueur affichée par Google), coupé sur un mot
function truncate(text, max = 155) {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max - 1))}…`;
}

/**
 * Fiches générées au moment du build (HTML complet, servi instantanément). Un produit ajouté ensuite est généré à
 * sa première visite. Next.js exige au moins une adresse : si l'API est injoignable pendant le build, on donne "0",
 * qui ne correspond à aucun produit (page 404) mais permet au build de se terminer.
 */
export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.length > 0 ? products.map((product) => ({ slug: slugOf(product) })) : [{ slug: '0' }];
}

/** Titre, description et image de partage propres à chaque produit */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = productIdFromSlug(slug);
  const product = id ? await getProduct(id) : null;
  if (!product) return { title: 'Produit introuvable' };

  const description = truncate(
    summaryOf(product) || `${product.product_name} : ${product.subcategory_name ?? product.category_name}, à découvrir sur La Jardinerie.`
  );
  const image = product.main_image_url ? resolveAssetUrl(product.main_image_url) : undefined;

  return {
    title: product.product_name,
    description,
    alternates: { canonical: productPath(product) },
    // openGraph remplace celui du layout en entier : on redonne la langue et le nom du site
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: 'La Jardinerie',
      title: product.product_name,
      description,
      ...(image && { images: [image] }),
    },
  };
}

/** Données structurées (schema.org) : permettent à Google d'afficher le prix et la disponibilité dans ses résultats */
function productJsonLd(product, description, images) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_name,
    image: images,
    description,
    ...(product.sku && { sku: product.sku }),
    category: product.subcategory_name ?? product.category_name,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${productPath(product)}`,
      priceCurrency: 'EUR',
      price: Number(product.price_tax_incl).toFixed(2),
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

/** Exposition et arrosage : pastille d'icône + libellé. L'icône est décorative, l'information est portée par le texte. */
function PlantNeeds({ product }) {
  const exposure = SUN_EXPOSURE_CONFIG[product.sun_exposure];
  const water = WATER_REQUIREMENT_CONFIG[product.water_requirement];
  // Même taille de pastille pour l'exposition et l'arrosage : les textes restent alignés
  const badge = 'flex h-11 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.18)]';

  return (
    <div className="mb-4 flex flex-wrap gap-x-8 gap-y-4 text-gray-700">
      {product.sun_exposure && (
        <div className="flex items-center gap-3">
          {exposure && (
            <span className={badge} aria-hidden="true">
              <exposure.Icon size={22} color={exposure.color} />
            </span>
          )}
          <div className="flex flex-col">
            <span className="mb-1 text-sm uppercase tracking-wide text-gray-500">Exposition</span>
            <span className="text-lg font-medium">{exposure?.label ?? product.sun_exposure}</span>
          </div>
        </div>
      )}
      {product.water_requirement && (
        <div className="flex items-center gap-3">
          {/* Le nombre de gouttes augmente avec le besoin en eau (1, 2 ou 3) */}
          {water && (
            <span className={`${badge} gap-0.5`} aria-hidden="true">
              {Array.from({ length: water.drops }, (_, i) => (
                <Droplet key={i} size={18} color={WATER_COLOR} fill={WATER_COLOR} fillOpacity={0.25} />
              ))}
            </span>
          )}
          <div className="flex flex-col">
            <span className="mb-1 text-sm uppercase tracking-wide text-gray-500">Arrosage</span>
            <span className="text-lg font-medium">{water?.label ?? product.water_requirement}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Next.js (en mode développement) recommande d'entourer la lecture de l'adresse d'un <Suspense> pour que le changement de
// page soit « instantané ». On ne le fait volontairement pas : un produit introuvable appelle notFound(), qui ne peut
// renvoyer le code HTTP 404 que si la réponse n'a pas encore commencé à partir. Avec un <Suspense>, Google recevrait un
// code 200 pour une page qui n'existe pas. Les fiches existantes sont de toute façon générées d'avance (generateStaticParams).
export const instant = false;

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const id = productIdFromSlug(slug);
  if (!id) notFound();

  const product = await getProduct(id);
  if (!product) notFound();

  // Anciennes adresses (/produit/12) : redirigées avant d'arriver ici (voir src/proxy.js). Une adresse au nom erroné
  // (/produit/12-autre-nom) affiche quand même la fiche : son adresse canonique indique à Google la bonne adresse.

  const fallbackImage = placeholderImg.src;
  // Photos de la galerie, avec un texte alternatif utile pour chacune
  const galleryImages = [product.main_image_url, product.secondary_image_url]
    .filter(Boolean)
    .map((path, index) => ({
      url: resolveAssetUrl(path),
      alt: index === 0 ? product.product_name : `${product.product_name} — vue ${index + 1}`,
    }));
  if (galleryImages.length === 0) galleryImages.push({ url: fallbackImage, alt: product.product_name });

  const catalogHref = product.plant_id ? '/vegetaux' : '/jardinage';
  // Fil d'Ariane : une étape sans lien (la sous-catégorie, quand elle existe) est la page courante
  const breadcrumbItems = [
    { label: 'Accueil', to: '/' },
    { label: product.category_name, to: catalogHref },
    ...(product.subcategory_name ? [{ label: product.subcategory_name }] : []),
  ];

  const parsedDescription = parseProductDescription(product.description, product.latin_name);
  const jsonLd = productJsonLd(
    product,
    truncate(summaryOf(product) || product.product_name, 500),
    galleryImages.map((image) => image.url)
  );

  // Seuls les champs utiles à l'achat partent vers le navigateur (pas la description complète)
  const buyBoxProduct = {
    id: product.id,
    product_name: product.product_name,
    price_tax_incl: product.price_tax_incl,
    tax_rate: product.tax_rate,
    stock_quantity: product.stock_quantity,
    main_image_url: product.main_image_url,
    sku: product.sku,
  };

  return (
    // Sous md : pleine largeur (-mx-6 annule le retrait p-6 de <main>, -mt-6 le retrait du haut). La place de la barre
    // d'achat collée en bas n'est pas réservée ici mais dans le pied de page (voir SiteChrome), sinon le vide s'additionne.
    <article className="-mx-6 -mt-6 md:mx-auto md:mt-0 md:max-w-7xl md:px-6 md:py-8">
      <script
        type="application/ld+json"
        // "<" remplacé par son code : un texte saisi dans l'admin ne peut pas fermer la balise <script>
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* md et plus : bouton Retour libellé. Sur mobile, un bouton rond est posé sur la galerie (voir plus bas). */}
      <BackButton variant="desktop" fallbackHref={catalogHref} />

      <div className="md:mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 lg:mb-12 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          key={product.id}
          // lg : la photo reste visible sous le header collant pendant la lecture de la colonne de droite
          className="lg:sticky lg:top-[calc(var(--header-h,140px)+1rem)] lg:self-start"
          images={galleryImages}
          label={product.product_name}
          fallbackUrl={fallbackImage}
          overlay={<BackButton variant="mobile" fallbackHref={catalogHref} />}
        />

        <div className="flex flex-col">
          <ProductBuyBox key={product.id} product={buyBoxProduct} />

          {(product.plant_id || product.description) && (
            <div className="border-t border-gray-100 bg-white px-4 py-6 md:mb-6 md:rounded-lg md:border md:border-gray-200 md:p-6">
              {product.plant_id && (product.sun_exposure || product.water_requirement) && <PlantNeeds product={product} />}

              {product.description && <ProductDescription {...parsedDescription} />}

              {product.plant_id && product.latin_name && (
                <p className="mt-2 text-sm text-gray-500">
                  <i className="font-serif">{product.latin_name}</i>
                  {product.genus && ` (${product.genus} ${product.species || ''})`}
                </p>
              )}
            </div>
          )}

          <ProductBotanicalSheet product={product} />
        </div>
      </div>
    </article>
  );
}
