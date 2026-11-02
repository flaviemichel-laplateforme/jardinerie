export default function LegalPageLayout({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-jardinerie-text mb-8">{title}</h1>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
