import { Lato } from 'next/font/google';
import './globals.css';
import Providers from './providers';

// La police est téléchargée au moment du build et servie par le site lui-même (plus de requête vers Google Fonts).
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
});

const siteName = 'La Jardinerie';
const defaultTitle = 'La Jardinerie — Végétaux & Jardinage';
const defaultDescription =
  "La Jardinerie : vente en ligne de végétaux et d'articles de jardinage, avec fiches techniques détaillées et conseils personnalisés pour choisir la plante adaptée à votre intérieur.";

// Tant que ce site n'a pas remplacé l'ancien, Google ne doit pas l'indexer : sinon il verrait deux sites identiques
// (contenu dupliqué) et pourrait pénaliser le vrai. SITE_INDEXABLE=true ne sera défini qu'au moment de la bascule.
const indexable = process.env.SITE_INDEXABLE === 'true';

// Titre par défaut + modèle : chaque page n'a plus qu'à donner son titre, le nom du site est ajouté automatiquement.
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jardinerie.vercel.app'),
  title: { default: defaultTitle, template: `%s | ${siteName}` },
  description: defaultDescription,
  icons: { icon: '/favicon.png' },
  robots: indexable ? undefined : { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: ['/assets/img/og-image.jpg'],
  },
  twitter: { card: 'summary_large_image', title: defaultTitle, description: defaultDescription },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={lato.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
