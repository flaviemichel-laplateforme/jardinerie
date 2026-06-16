import { useState } from 'react';
import loupeIcon from '../../../assets/img/icone-loupe.svg';

export default function SearchBar() {
// Déclaration de l'état local pour stocker la recherche
    const [searchQuery, setSearchQuery] = useState('');

    // Fonction déclenchée lors de la validation (clic ou touche Entrée)
    const handleSearch = (e) => {
        e.preventDefault();

        console.log("L'utilisateur recherche:", searchQuery);
    };

    return (
        <form onSubmit={handleSearch} className="flex-grow max-w-xl mx-12">
            <div className="flex items-center border border-jardinerie-primary rounded-lg bg-[#EAECE1] overflow-hidden h-12 shadow-sm focus-within:ring-2 focus-within:ring-jardinerie-primary/50 transition-all">
        
        {/* Champ de saisie */}
        <input 
          type="text" 
          placeholder="Rechercher une plante, un outil..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 px-6 bg-transparent focus:outline-none text-jardinerie-text placeholder-jardinerie-text/50"
        />
        
        {/* Ligne de séparation verticale */}
        <div className="h-8 border-l border-jardinerie-primary"></div>
        
        {/* Bouton de soumission */}
        <button 
          type="submit" 
          className="px-4 hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
          aria-label="Lancer la recherche"
        >
          <img src={loupeIcon} alt="" className="h-6 w-6 object-contain" aria-hidden="true" />
        </button>
        
      </div>
        </form>
    )


}