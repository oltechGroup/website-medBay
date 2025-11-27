import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Esta función crea el "puente" entre el frontend (3000) y el backend (3001) para las imágenes
  async rewrites() {
    return [
      {
        source: '/uploads/:path*', // Cuando el navegador pida algo que empiece con /uploads...
        destination: 'http://localhost:3001/uploads/:path*', // ...Next.js lo buscará secretamente aquí
      },
    ];
  },
};

export default nextConfig;