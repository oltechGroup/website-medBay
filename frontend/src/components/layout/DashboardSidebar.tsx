'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ACTUALIZACIÓN: navigation array con nuevas rutas de inventario y datos maestros
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Productos', href: '/dashboard/products', icon: '💊' },
  { name: 'Categorías', href: '/dashboard/categories', icon: '🗂️' },
  { name: 'Fabricantes', href: '/dashboard/manufacturers', icon: '🏭' },
  { 
    name: 'Inventario', 
    href: '/dashboard/inventory', 
    icon: '📦',
    submenu: [
      { name: 'Gestión de Lotes', href: '/dashboard/inventory', icon: '📋' },
      { name: 'Parámetros Caducidad', href: '/dashboard/inventory/expiry-settings', icon: '⏰' },
    ]
  },
  { name: 'Proveedores', href: '/dashboard/suppliers', icon: '🏢' },
  // NUEVO MÓDULO - DATOS MAESTROS
  { 
    name: 'Datos Maestros', 
    href: '/dashboard/master-data', 
    icon: '🌎',
    submenu: [
      { name: 'Países', href: '/dashboard/master-data/countries', icon: '🇺🇸' },
      { name: 'Monedas', href: '/dashboard/master-data/currencies', icon: '💰' },
      { name: 'Códigos Fiscales', href: '/dashboard/master-data/tax-codes', icon: '📑' },
    ]
  },
  { name: 'Órdenes', href: '/dashboard/orders', icon: '📋' },
  { name: 'Clientes', href: '/dashboard/customers', icon: '👥' },
  { name: 'Importar', href: '/dashboard/import', icon: '📤' },
  { name: 'Reportes', href: '/dashboard/reports', icon: '📈' },
  { name: 'Documentos', href: '/dashboard/documents', icon: '📄' },
  { name: 'Configuración', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{[key: string]: boolean}>({});

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'MB';

  const toggleSubmenu = (menuName: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(item => pathname === item.href);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold">
            MB
          </div>
          <div className="text-sm font-medium">MedBay</div>
        </div>

        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-gray-50"
        >
          <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-40 left-0 top-0 h-full w-64 bg-white border-r shadow-sm transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-blue-600">
          <div className="text-white text-xl font-bold">MedBay</div>
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 text-white hover:bg-blue-500 rounded-md"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M6 6L14 14M6 14L14 6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-5 border-b">
          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.full_name ?? 'Usuario'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.verification_level ?? ''}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.submenu && isSubmenuActive(item.submenu));
            const isSubmenuOpen = openSubmenus[item.name];

            return (
              <div key={item.name}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={cn(
                        'flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                      </div>
                      <svg
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isSubmenuOpen ? "rotate-180" : ""
                        )}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    
                    {isSubmenuOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              pathname === subItem.href
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <span className="text-lg">{subItem.icon}</span>
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t">
          <Link
            href="/profile"
            className="flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900"
            onClick={() => setOpen(false)}
          >
            <svg
              className="h-4 w-4 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
                1.79-4 4 1.79 4 4 4z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Perfil
          </Link>
        </div>
      </aside>

      {/* Layout padding fix */}
      <div className="hidden md:block md:w-64" />
    </>
  );
}