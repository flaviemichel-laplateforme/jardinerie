import Link from 'next/link';
import LegalPageLayout from '../../components/legal/LegalPageLayout';

export const metadata = {
  title: 'Politique de confidentialité',
  description: "Comment La Jardinerie collecte, utilise et protège vos données personnelles, et comment exercer vos droits (RGPD).",
  alternates: { canonical: '/politique-confidentialite' },
};

export default function PolitiqueConfidentialite() {
  return (
    <LegalPageLayout title="Politique de Confidentialité">
      <section>
        <h2 className="legal-heading">1. Données collectées</h2>
        <p className="legal-paragraph">
          Lors de la création d’un compte ou d’une commande, La Jardinerie
          collecte les données suivantes : nom, prénom, adresse e-mail,
          adresse postale, et historique de commandes.
        </p>
        <p className="legal-paragraph">
          Pour protéger les comptes, le site enregistre aussi des données de
          sécurité lors des connexions et des opérations sensibles (connexion
          réussie ou échouée, changement de mot de passe ou d’adresse e-mail,
          suppression de compte) : l’adresse IP, le type de navigateur utilisé
          et la date. Votre adresse e-mail n’y figure jamais en clair : elle est
          remplacée par une empreinte illisible qui ne permet pas de vous
          identifier à la simple lecture.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">2. Finalité du traitement</h2>
        <p className="legal-paragraph">
          Ces données sont utilisées pour la gestion des comptes clients, le
          traitement des commandes, la livraison, et la communication liée
          au suivi de commande.
        </p>
        <p className="legal-paragraph">
          Les données de sécurité servent uniquement à protéger le site et
          vos comptes : détecter les tentatives de connexion abusives, limiter
          le nombre d’essais successifs (pour empêcher de deviner un mot de
          passe) et enquêter en cas d’incident.
        </p>
        <p className="legal-paragraph">
          Pour distinguer les visiteurs des robots, les formulaires d’inscription,
          de « mot de passe oublié » et de connexion (après plusieurs échecs)
          utilisent le service Cloudflare Turnstile. Il analyse le navigateur
          et l’adresse IP du visiteur pendant le contrôle ; Cloudflare agit
          comme prestataire technique et n’utilise pas ces données à des fins
          publicitaires.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">3. Base légale</h2>
        <p className="legal-paragraph">
          Le traitement de vos données repose sur l’exécution du contrat de
          vente (article 6.1.b du RGPD), ainsi que sur votre consentement
          explicite recueilli lors de votre inscription. Les données de sécurité
          reposent sur notre intérêt légitime à protéger le site et ses
          utilisateurs (article 6.1.f du RGPD).
        </p>
      </section>

      <section>
        <h2 className="legal-heading">4. Durée de conservation</h2>
        <p className="legal-paragraph">
          Les données sont conservées pendant toute la durée de la relation
          commerciale, puis archivées conformément aux obligations légales
          comptables et fiscales. Si vous supprimez votre compte, vos données
          personnelles sont anonymisées immédiatement ; seul l’historique des
          commandes est conservé, sans lien avec votre identité.
        </p>
        <p className="legal-paragraph">
          Les données de sécurité (adresse IP, navigateur) sont conservées
          12 mois, puis supprimées automatiquement. Elles sont effacées dès la
          suppression de votre compte. Les compteurs servant à limiter les
          tentatives de connexion sont temporaires et supprimés au bout de
          quelques heures.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">5. Destinataires des données</h2>
        <p className="legal-paragraph">
          Vos données sont destinées exclusivement à La Jardinerie et à ses
          prestataires techniques nécessaires au bon fonctionnement du site :
          l’hébergement du site et de l’API, l’envoi des e-mails liés à votre
          compte et à vos commandes (Brevo), le contrôle anti-robots des formulaires
          (Cloudflare Turnstile) et le paiement en ligne (Stripe).
          Elles ne sont jamais vendues à des tiers.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">6. Vos droits</h2>
        <p className="legal-paragraph">
          Conformément au RGPD, vous disposez des droits suivants sur vos
          données personnelles :
        </p>
        <ul className="legal-list">
          <li>Droit d’accès et de rectification</li>
          <li>Droit à l’effacement (droit à l’oubli)</li>
          <li>Droit à la portabilité de vos données</li>
          <li>Droit d’opposition au traitement</li>
        </ul>
        <p className="legal-paragraph">
          Vous pouvez exercer votre droit à l’oubli directement depuis votre
          espace client, dans la section{' '}
          <Link href="/compte/rgpd" className="text-jardinerie-primary underline">
            Confidentialité &amp; RGPD
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">7. Cookies</h2>
        <p className="legal-paragraph">
          Le site utilise un cookie technique indispensable au maintien de
          votre session de connexion. Il est inaccessible aux scripts de la
          page, valable 24 heures au plus, et supprimé à la déconnexion. Ce
          cookie ne sert à aucune finalité publicitaire ou de traçage.
        </p>
        <p className="legal-paragraph">
          Le contenu de votre panier est conservé dans le stockage local de
          votre navigateur, sur votre appareil : il n’est transmis à personne
          avant la commande.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">8. Contact</h2>
        <p className="legal-paragraph">
          Pour toute question relative à vos données personnelles, vous
          pouvez nous contacter à l’adresse : contact@lajardinerie.fr.
        </p>
      </section>
    </LegalPageLayout>
  );
}
