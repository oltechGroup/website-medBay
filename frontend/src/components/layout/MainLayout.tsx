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

  // Detectamos si estamos en alguna ruta de productos para cambiar el header
  // (Puede ser /products o /products/categoria...)
  const isCatalog = pathname?.startsWith('/products');

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