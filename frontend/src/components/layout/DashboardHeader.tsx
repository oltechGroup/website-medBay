'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export default function DashboardHeader({ onMenuToggle, sidebarOpen }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const routes: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/dashboard/products': 'Productos',
      '/dashboard/categories': 'Categorías',
      '/dashboard/manufacturers': 'Fabricantes',
      '/dashboard/inventory': 'Inventario',
      '/dashboard/suppliers': 'Proveedores',
      '/dashboard/countries': 'Países',
      '/dashboard/orders': 'Órdenes',
      '/dashboard/customers': 'Clientes',
      '/dashboard/import': 'Importar Datos',
      '/dashboard/reports': 'Reportes',
      '/dashboard/documents': 'Documentos',
      '/dashboard/settings': 'Configuración',
    };

    // Buscar coincidencia exacta o parcial para rutas anidadas
    const exactMatch = routes[pathname];
    if (exactMatch) return exactMatch;

    // Para rutas anidadas como /dashboard/products/edit/123
    for (const [route, title] of Object.entries(routes)) {
      if (pathname.startsWith(route + '/')) {
        return title;
      }
    }

    return 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(path => path);
    const breadcrumbs = [];
    
    // Siempre empezar con Dashboard
    breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' });

    // Construir breadcrumbs dinámicamente
    let currentPath = '';
    for (let i = 1; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;
      const routeName = getRouteName(paths[i]);
      if (routeName) {
        breadcrumbs.push({ 
          name: routeName, 
          href: `/dashboard${currentPath}` 
        });
      }
    }

    return breadcrumbs;
  };

  const getRouteName = (path: string) => {
    const routeNames: { [key: string]: string } = {
      'products': 'Productos',
      'categories': 'Categorías',
      'manufacturers': 'Fabricantes',
      'inventory': 'Inventario',
      'suppliers': 'Proveedores',
      'countries': 'Países',
      'orders': 'Órdenes',
      'customers': 'Clientes',
      'import': 'Importar',
      'reports': 'Reportes',
      'documents': 'Documentos',
      'settings': 'Configuración',
      'new': 'Nuevo',
      'edit': 'Editar',
      'images': 'Imágenes'
    };
    return routeNames[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MB';

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left section - Menu toggle and breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Menu toggle button */}
          <button
            onClick={onMenuToggle}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Page title and breadcrumbs */}
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
            {breadcrumbs.length > 1 && (
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && (
                      <span className="mx-2 text-gray-300">/</span>
                    )}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="text-gray-900 font-medium">{crumb.name}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Right section - Search, notifications, user menu */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden lg:block relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar en el sistema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {/* Notification items */}
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <p className="text-sm text-gray-900">Nuevo pedido recibido</p>
                    <p className="text-xs text-gray-500 mt-1">Hace 5 minutos</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <p className="text-sm text-gray-900">Producto agotado: Paracetamol</p>
                    <p className="text-xs text-gray-500 mt-1">Hace 1 hora</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm text-gray-900">Actualización del sistema completada</p>
                    <p className="text-xs text-gray-500 mt-1">Hace 2 horas</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.verification_level === 'admin' ? 'Administrador' : 'Usuario'}
                </p>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-500 transition-transform",
                isUserMenuOpen ? "rotate-180" : ""
              )} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Usuario'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  Mi Perfil
                </Link>
                
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Configuración
                </Link>
                
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="lg:hidden px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </header>
  );
}