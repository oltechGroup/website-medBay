//frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
// ✅ Importamos el nuevo Layout Maestro
import MainLayout from '@/components/layout/MainLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedBay - Global Access to Medical Devices',
  description: 'Plataforma B2B especializada en insumos médicos y gestión de inventario.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {/* ✅ Envolvemos todo en MainLayout */}
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}