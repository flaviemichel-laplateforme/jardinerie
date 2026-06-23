import { Link } from 'react-router-dom';

// Leçon de destructuration : On définit les "props" (propriétés) que ce composant peut recevoir.
// On leur donne des valeurs par défaut au cas où on oublierait de les renseigner.
export default function HeroBanner({ 
  imageSrc = "/src/assets/img/fond.png", 
  altText = "Bannière promotionnelle",
  buttonText = "Voir les offres",
  buttonLink = "/vegetaux"
}) {
  return (
    // On conserve exactement la même structure et les mêmes classes Tailwind
    <section className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="relative flex h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-[20px] bg-gray-100 md:h-[400px]">
        
        {/* L'image devient dynamique grâce à la prop imageSrc */}
        <img 
          src={imageSrc} 
          alt={altText} 
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        
        <div className="absolute inset-0 bg-jardinerie-text/20"></div>

        {/* Le lien et le texte du bouton deviennent dynamiques */}
        <div className="absolute bottom-8 z-10">
          <Link 
            to={buttonLink} 
            className="rounded-full bg-black/50 px-8 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-jardinerie-primary hover:scale-105 shadow-sm hover:shadow-md"
          >
            {buttonText}
          </Link>
        </div>
        
      </div>
    </section>
  );
}