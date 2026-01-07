//frontend/src/app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 font-sans">
        
        {/* 1. HEADER GLOBAL (Fixed Top) */}
        {/* 'variant="dashboard"' activa el padding izquierdo y los controles de admin */}
        <Header 
          variant="dashboard" 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* 2. SIDEBAR (Fixed Left) */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* 3. CONTENIDO PRINCIPAL */}
        {/* IMPORTANTE: lg:ml-64 deja el espacio exacto para el Sidebar (256px) en escritorio */}
        {/* Esto evita que el contenido se corte o quede debajo del sidebar */}
        <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
          
          {/* pt-[85px]: Baja el contenido para que no quede debajo del Header fijo */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-10 pt-[85px] animate-in fade-in duration-500">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>

        </div>

        {/* 4. OVERLAY MÓVIL (Solo visible cuando sidebarOpen es true en pantallas chicas) */}
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