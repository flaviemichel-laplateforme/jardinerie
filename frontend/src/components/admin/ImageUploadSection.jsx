export default function ImageUploadSection({ imagePreview, placeholderImg, handleImageChange, uploading }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-base font-bold text-jardinerie-text">Image principale</h2>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="shrink-0">
          <img 
            src={imagePreview || placeholderImg} 
            alt="Aperçu" 
            className="h-32 w-32 rounded-xl object-cover border border-gray-200" 
          />
        </div>
        <div className="flex-1 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Choisir une image (JPG, PNG, WebP)</label>
          <input 
            type="file" 
            accept="image/jpeg,image/png,image/webp" 
            onChange={handleImageChange} 
            className="w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-jardinerie-bg file:px-4 file:py-2 file:text-sm file:font-medium file:text-jardinerie-primary hover:file:bg-jardinerie-primary hover:file:text-white focus:outline-none" 
          />
          {uploading && <p className="text-xs text-jardinerie-primary animate-pulse">Upload en cours...</p>}
        </div>
      </div>
    </section>
  );
}