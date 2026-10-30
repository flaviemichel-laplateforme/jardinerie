// Source unique pour l'affichage de l'exposition et de l'arrosage des plantes (libellé + icône + couleur),
// partagée entre la carte produit et la fiche produit pour éviter toute divergence.
import { Sun, CloudSun, Cloud } from 'lucide-react';

// Clés = valeurs de l'ENUM `plants.sun_exposure` en base
export const SUN_EXPOSURE_CONFIG = {
  'Sun':           { label: 'Plein Soleil', Icon: Sun,      color: '#F4A261' },
  'Partial Shade': { label: 'Mi-ombre',     Icon: CloudSun, color: '#A98A7D' },
  'Shade':         { label: 'Ombre',        Icon: Cloud,    color: '#505F40' },
};

// Clés = valeurs de l'ENUM `plants.water_requirement` en base.
// `drops` : nombre de gouttes affichées, qui augmente avec le besoin en eau.
export const WATER_REQUIREMENT_CONFIG = {
  'Low':    { label: 'Faible', drops: 1 },
  'Medium': { label: 'Moyen',  drops: 2 },
  'High':   { label: 'Élevé',  drops: 3 },
};

export const WATER_COLOR = '#3B82C4';

// --- Fiche botanique détaillée (Lot A) : clés = valeurs des ENUM en base (plants / products) ---

export const FOLIAGE_LABELS = {
  'Deciduous':      'Caduc',
  'Evergreen':      'Persistant',
  'Semi-evergreen': 'Semi-persistant',
};

export const DROUGHT_LABELS = {
  'Low':    'Faible',
  'Medium': 'Moyenne',
  'High':   'Forte',
};

export const DIFFICULTY_LABELS = {
  'Beginner':     'Facile (débutant)',
  'Intermediate': 'Intermédiaire',
  'Expert':       'Exigeant (expert)',
};

export const PACKAGING_LABELS = {
  'Pot':       'En pot',
  'Plug':      'En godet',
  'Bare root': 'Racines nues',
  'Root ball': 'En motte',
};

// Index 0 = janvier (le mois 1 en base)
export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
