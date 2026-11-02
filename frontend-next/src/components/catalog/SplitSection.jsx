import fond from '../../assets/img/fond.jpg';
import Link from 'next/link';

export default function SplitSection({
   buttonText="Nous contacter pour un conseil",
    buttonLink="/contact"
}) {
  
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-1 sm:px-6">
      
      {/* LE CONTENEUR PRINCIPAL (La Boîte Magique)
        - grid : active la grille moderne
        - grid-cols-1 : 1 colonne par défaut (pour les téléphones)
        - md:grid-cols-2 : 2 colonnes sur grand écran (le fameux 50/50)
        - gap-8 : crée un espace de respiration entre l'image et le texte
        - items-center : centre le texte verticalement par rapport à l'image
      */}
      <div className="grid grid-cols-1 gap-8 items-center rounded-3xl bg-jardinerie-bg p-6 md:grid-cols-2 md:p-12">
        
        {/* ========================================== */}
        {/* BLOC GAUCHE : L'IMAGE                      */}
        {/* ========================================== */}
        {/* Sur mobile la hauteur suit la largeur (ratio 16/10), sur desktop elle est fixée (md:h-[400px]) */}
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl md:aspect-auto md:h-[400px]">
          <img 
            src={fond.src} 
            alt="Jardinage professionnel" 
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* ========================================== */}
        {/* BLOC DROITE : LE TEXTE                     */}
        {/* ========================================== */}
        {/* flex-col permet d'empiler proprement le titre, le paragraphe et le bouton */}
        <div className="flex flex-col justify-center">
          
          <span className="mb-2 text-sm font-extrabold uppercase tracking-widest text-jardinerie-primary">
            Notre Expertise
          </span>
          
          <h2 className="mb-6 text-3xl font-extrabold leading-tight text-jardinerie-text sm:text-4xl">
            Cultivez votre passion avec nos experts
          </h2>
          
          <p className="mb-8 text-lg text-jardinerie-text/70">
            Que vous soyez novice ou jardinier chevronné, notre équipe sélectionne pour vous les meilleurs végétaux et vous accompagne pas à pas pour créer le jardin de vos rêves. 
          </p>
          
          {/* self-start empêche le bouton de prendre toute la largeur de la colonne */}
          <Link
            href={buttonLink}
            className="self-start rounded-full bg-jardinerie-primary px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-green-700 hover:-translate-y-1 hover:shadow-lg"
          >
            {buttonText}
          </Link>
          
        </div>

      </div>
    </section>
  );
};