/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        jardinerie: {
          primary: '#027148', // Vert foncé (boutons, en-tête nav)
          text: '#505F40',    // Vert olive (titres, textes)
          bg: '#EDF0E2',      // Beige très clair (fond général)
          brown: '#A98A7D',   // Marron
          sand: '#DFD3C3',    // Beige foncé
          light: '#F0ECE2'    // Blanc cassé
        }
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'Lato', 'sans-serif'], // Lato, chargée par next/font (voir src/app/layout.jsx)
      }
    },
  },
  plugins: [],
}

export default config;
