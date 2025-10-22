'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Título dinámico según la ruta
  const pageTitle = (() => {
    if (pathname === '/dashboard/inventory') return 'Gestión de Lotes 📦';
    if (pathname === '/dashboard/inventory/expiry-settings') return 'Parámetros de Caducidad ⏰';
    if (pathname.includes('/suppliers')) return 'Proveedores 🏢';
    // NUEVAS RUTAS - DATOS MAESTROS
    if (pathname === '/dashboard/master-data/countries') return 'Países 🌎';
    if (pathname === '/dashboard/master-data/currencies') return 'Monedas 💰';
    if (pathname === '/dashboard/master-data/tax-codes') return 'Códigos Fiscales 📑';
    if (pathname.includes('/master-data')) return 'Datos Maestros 🌎';
    if (pathname.includes('/products')) return 'Productos 💊';
    if (pathname.includes('/categories')) return 'Categorías 🗂️';
    if (pathname.includes('/manufacturers')) return 'Fabricantes 🏭';
    if (pathname.includes('/inventory')) return 'Inventario 📦';
    if (pathname.includes('/orders')) return 'Órdenes 📋';
    if (pathname.includes('/import')) return 'Importar 📤';
    return 'Panel Principal 📊';
  })();

  return (
    <header className="sticky top-0 z-30 bg-white border-b shadow-sm md:pl-64">
      <div className="flex justify-between items-center px-6 py-3">
        {/* Título */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500">
            Bienvenido, {user?.full_name || 'Usuario'}
          </p>
        </div>

        {/* Usuario y logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">
              {user?.full_name}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {user?.verification_level?.replace('_', ' ')}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className={cn(
              'bg-blue-600 text-white hover:bg-blue-700 border-0 rounded-md font-medium transition'
            )}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  );
}