/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vous pourrez ajouter vos couleurs Figma ici plus tard (ex: vert jardinerie)
        'jardin-vert': '#505F40', 
      }
    },
  },
  plugins: [],
}

