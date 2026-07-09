/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. Conservation de la charte graphique de la Jardinerie
        jardinerie: {
          primary: '#027148', // Vert foncé (boutons, en-tête nav)
          text: '#505F40',    // Vert olive (titres, textes)
          bg: '#EDF0E2',      // Beige très clair (fond général)
          brown: '#A98A7D',   // Marron
          sand: '#DFD3C3',    // Beige foncé
          light: '#F0ECE2'    // Blanc cassé
        },
        // 2. Injection des variables requises par le Preset Nova de Shadcn v4
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'], // Conservation de la police principale
      }
    },
  },
  plugins: [],
}