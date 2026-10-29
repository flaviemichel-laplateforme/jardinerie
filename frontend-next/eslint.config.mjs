import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Les images restent des <img> pendant la migration : les photos des produits viennent de l'API PHP (Plesk).
      // Le passage à next/image (redimensionnement automatique) est prévu plus tard, une fois toutes les pages portées.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
