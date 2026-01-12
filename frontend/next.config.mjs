/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https', // CAMBIADO a https
        hostname: 'api.medbaysupply.com', // CAMBIADO al dominio real
      },
    ],
  },

  async rewrites() {
    // Usamos la URL de producción por defecto
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.medbaysupply.com';
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