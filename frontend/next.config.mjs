/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Ignorar errores estrictos en build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // 3. Rewrites (Proxy)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Quitamos la barra final si existe
    const cleanUrl = apiUrl.replace(/\/$/, '');

    return [
      {
        source: '/uploads/:path*',
        destination: `${cleanUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;