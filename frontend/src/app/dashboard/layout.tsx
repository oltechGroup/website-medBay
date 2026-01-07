//frontend/src/app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils'; // Utilidad para clases condicionales

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado para el menú móvil (Off-canvas)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ✅ ESTADO PRINCIPAL DEL COLAPSO
  // true = Inicia "Mini" (Iconos) -> Lo que pediste
  // false = Inicia "Expandido" (Texto + Iconos)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(true);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans">
        
        {/* 1. HEADER GLOBAL (Fixed Top) */}
        {/* Le pasamos el estado para que sepa cuánto margen dejar a la izquierda */}
        <Header 
          variant="dashboard" 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          isDesktopCollapsed={isDesktopCollapsed}
        />

        {/* 2. SIDEBAR (Fixed Left) */}
        {/* Le pasamos el control para que se dibuje chico o grande */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isDesktopCollapsed}
          onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        />
        
        {/* 3. CONTENIDO PRINCIPAL */}
        {/* AQUÍ ESTÁ LA MAGIA DEL ESPACIO:
            - Si está colapsado: lg:ml-20 (80px) -> Se pega a la izquierda
            - Si está expandido: lg:ml-64 (256px) -> Deja espacio para el menú
        */}
        <div 
          className={cn(
            "min-h-screen flex flex-col transition-all duration-300 ease-in-out",
            isDesktopCollapsed ? "lg:ml-20" : "lg:ml-64"
          )}
        >
          
          {/* pt-[85px]: Compensa la altura del Header fijo */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-10 pt-[85px] animate-in fade-in duration-500">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>

        </div>

        {/* 4. OVERLAY MÓVIL (Fondo oscuro al abrir menú en celular) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}