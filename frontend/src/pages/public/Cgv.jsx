import LegalPageLayout from '../../components/legal/LegalPageLayout';

export default function Cgv() {
  return (
    <LegalPageLayout title="Conditions Générales de Vente">
      <section>
        <h2 className="legal-heading">1. Objet</h2>
        <p className="legal-paragraph">
          Les présentes Conditions Générales de Vente (CGV) régissent les
          relations contractuelles entre La Jardinerie et toute personne
          effectuant un achat sur le site. Toute commande passée sur le site
          implique l'acceptation pleine et entière des présentes CGV.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">2. Prix</h2>
        <p className="legal-paragraph">
          Les prix des produits sont indiqués en euros, toutes taxes
          comprises (TTC). La Jardinerie se réserve le droit de modifier ses
          prix à tout moment, étant entendu que le prix figurant au moment de
          la commande sera le seul applicable à l'acheteur.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">3. Commande</h2>
        <p className="legal-paragraph">
          La commande n'est définitive qu'après confirmation du paiement. Un
          e-mail de confirmation est envoyé au client récapitulant les
          éléments de sa commande.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">4. Modalités de paiement</h2>
        <p className="legal-paragraph">
          Le paiement s'effectue en ligne, par carte bancaire, via un
          prestataire de paiement sécurisé. Aucune donnée bancaire n'est
          conservée par La Jardinerie.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">5. Livraison</h2>
        <p className="legal-paragraph">
          Les produits sont livrés à l'adresse indiquée par le client lors de
          la commande. Les délais de livraison sont donnés à titre indicatif
          et peuvent varier selon la disponibilité des produits.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">6. Droit de rétractation</h2>
        <p className="legal-paragraph">
          Conformément à l'article L221-28 du Code de la consommation, le
          droit de rétractation ne s'applique pas aux biens susceptibles de
          se détériorer ou de se périmer rapidement — c'est notamment le cas
          des végétaux vivants vendus sur le site.
        </p>
        <p className="legal-paragraph">
          Pour les autres produits (outils, équipements de jardinage), le
          client dispose d'un délai de 14 jours à compter de la réception
          pour exercer son droit de rétractation.
        </p>
      </section>

      <section>
        <h2 className="legal-heading">7. Garanties légales</h2>
        <p className="legal-paragraph">
          Tous les produits bénéficient des garanties légales suivantes :
        </p>
        <ul className="legal-list">
          <li>La garantie légale de conformité (articles L217-4 et suivants du Code de la consommation)</li>
          <li>La garantie contre les vices cachés (articles 1641 et suivants du Code civil)</li>
        </ul>
      </section>

      <section>
        <h2 className="legal-heading">8. Litiges</h2>
        <p className="legal-paragraph">
          En cas de litige, le client peut recourir à une solution de
          médiation conventionnelle. À défaut, le litige sera porté devant
          les tribunaux compétents.
        </p>
      </section>
    </LegalPageLayout>
  );
}
