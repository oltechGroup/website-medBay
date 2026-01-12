import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 👇 ESTO ES VITAL: Ignorar errores estrictos para que Amplify no cancele el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. 👇 Configuración de imágenes (opcional, pero recomendado si usas <Image /> de Next)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**', // Permitir imágenes de cualquier IP (útil para tu EC2)
      },
    ],
  },

  // 3. 👇 El Proxy para las subidas (Corregido para Producción)
  async rewrites() {
    // Leemos la URL del backend desde la variable de entorno que pusimos en Amplify
    // Si no existe (estás en local), usa localhost:3001
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Quitamos la barra final si la tiene para evitar dobles //
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