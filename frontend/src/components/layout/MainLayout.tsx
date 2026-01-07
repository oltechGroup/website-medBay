//frontend/src/components/layout/MainLayout.tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  // Detectamos si estamos en alguna ruta de productos (catálogo)
  const isCatalog = pathname?.startsWith('/products');
  
  // ✅ CORRECCIÓN CRÍTICA:
  // Detectamos si estamos dentro del Panel de Administrador.
  // Si es así, NO renderizamos el Header/Footer públicos para evitar conflictos.
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* El Header decide qué mostrar según la ruta */}
      <Header variant={isCatalog ? 'catalog' : 'default'} />
      
      {/* Añadimos padding-top para compensar el Header Fixed */}
      <main className="flex-1 pt-[72px] animate-in fade-in duration-500">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}