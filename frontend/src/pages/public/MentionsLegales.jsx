import LegalPageLayout from '../../components/legal/LegalPageLayout';

export default function MentionsLegales() {
  return (
    <LegalPageLayout title="Mentions Légales">
      <section>
        <h2 className="legal-heading">1. Éditeur du site</h2>
        <p className="legal-paragraph">
          Le site La Jardinerie est édité par la société La Jardinerie SARL,
          au capital social de 10 000 €, immatriculée au Registre du Commerce
          et des Sociétés sous le numéro SIRET 000 000 000 00000, dont le
          siège social est situé au 12 rue des Serres, 44000 Nantes, France.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">2. Directeur de la publication</h2>
        <p className="legal-paragraph">
          Le directeur de la publication est le représentant légal de La
          Jardinerie SARL.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">3. Hébergement</h2>
        <p className="legal-paragraph">
          Le site est hébergé par un prestataire d'hébergement web, dont les
          coordonnées peuvent être communiquées sur simple demande auprès de
          l'éditeur.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">4. Propriété intellectuelle</h2>
        <p className="legal-paragraph">
          L'ensemble des contenus présents sur ce site (textes, images, logos,
          éléments graphiques) est la propriété exclusive de La Jardinerie
          SARL, sauf mention contraire. Toute reproduction, même partielle,
          est interdite sans autorisation préalable.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">5. Contact</h2>
        <p className="legal-paragraph">
          Pour toute question relative au site, vous pouvez nous contacter à
          l'adresse suivante : contact@lajardinerie.fr.
        </p>
      </section>
    </LegalPageLayout>
  );
}
