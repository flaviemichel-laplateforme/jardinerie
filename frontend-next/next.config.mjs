// Adresse de l'API PHP (Docker en local, Plesk en production).
const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:8000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // Relais : tout ce que le navigateur envoie à "/api/..." est transmis à l'API PHP.
  // Le navigateur croit parler au site (même domaine) : le cookie de session n'est plus un cookie « tiers ».
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
