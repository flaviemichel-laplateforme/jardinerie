import LegalPageLayout from '../../components/legal/LegalPageLayout';

export const metadata = {
  title: 'Nous contacter',
  description: "Contactez La Jardinerie à Nantes : adresse, téléphone et e-mail pour un conseil ou une question sur votre commande.",
  alternates: { canonical: '/contact' },
};

export default function Contact() {
  return (
    <LegalPageLayout title="Nous contacter">
      <section>
        <h2 className="legal-heading">Adresse</h2>
        <p className="legal-paragraph">
          La Jardinerie SARL
          <br />
          12 rue des Serres, 44000 Nantes, France
        </p>
      </section>

      <section>
        <h2 className="legal-heading">Téléphone</h2>
        <p className="legal-paragraph">02 40 00 00 00</p>
      </section>

      <section>
        <h2 className="legal-heading">Email</h2>
        <p className="legal-paragraph">contact@lajardinerie.fr</p>
      </section>
    </LegalPageLayout>
  );
}
