import LegalPageLayout from '../../components/legal/LegalPageLayout';

export default function PolitiqueConfidentialite() {
  return (
    <LegalPageLayout title="Politique de Confidentialité">
      <section>
        <h2 className="legal-heading">1. Données collectées</h2>
        <p className="legal-paragraph">
          Lors de la création d'un compte ou d'une commande, La Jardinerie
          collecte les données suivantes : nom, prénom, adresse e-mail,
          adresse postale, et historique de commandes.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">2. Finalité du traitement</h2>
        <p className="legal-paragraph">
          Ces données sont utilisées pour la gestion des comptes clients, le
          traitement des commandes, la livraison, et la communication liée
          au suivi de commande.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">3. Base légale</h2>
        <p className="legal-paragraph">
          Le traitement de vos données repose sur l'exécution du contrat de
          vente (article 6.1.b du RGPD), ainsi que sur votre consentement
          explicite recueilli lors de votre inscription.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">4. Durée de conservation</h2>
        <p className="legal-paragraph">
          Les données sont conservées pendant toute la durée de la relation
          commerciale, puis archivées conformément aux obligations légales
          comptables et fiscales.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">5. Destinataires des données</h2>
        <p className="legal-paragraph">
          Vos données sont destinées exclusivement à La Jardinerie et à ses
          prestataires techniques nécessaires au bon fonctionnement du site
          (hébergement, paiement en ligne). Elles ne sont jamais vendues à
          des tiers.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">6. Vos droits</h2>
        <p className="legal-paragraph">
          Conformément au RGPD, vous disposez des droits suivants sur vos
          données personnelles :
        </p>
        <ul className="legal-list">
          <li>Droit d'accès et de rectification</li>
          <li>Droit à l'effacement (droit à l'oubli)</li>
          <li>Droit à la portabilité de vos données</li>
          <li>Droit d'opposition au traitement</li>
        </ul>
        <p className="legal-paragraph">
          Vous pouvez exercer votre droit à l'oubli directement depuis votre
          espace client, dans la section{' '}
          <a href="/compte/rgpd" className="text-jardinerie-primary underline">
            Confidentialité &amp; RGPD
          </a>.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">7. Cookies</h2>
        <p className="legal-paragraph">
          Le site utilise un cookie technique indispensable au maintien de
          votre session de connexion. Ce cookie ne sert à aucune finalité
          publicitaire ou de traçage.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">8. Contact</h2>
        <p className="legal-paragraph">
          Pour toute question relative à vos données personnelles, vous
          pouvez nous contacter à l'adresse : contact@lajardinerie.fr.
        </p>
      </section>
    </LegalPageLayout>
  );
}
