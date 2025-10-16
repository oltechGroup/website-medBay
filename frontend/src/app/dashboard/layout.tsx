'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar fijo */}
        <DashboardSidebar />

        {/* Contenedor principal */}
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
