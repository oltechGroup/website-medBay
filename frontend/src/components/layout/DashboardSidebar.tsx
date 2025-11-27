'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Factory,
  Warehouse,
  Building,
  Globe,
  FileText,
  ShoppingCart,
  Users,
  Upload,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

// Navigation array actualizada con iconos Lucide y estructura mejorada
const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Resumen general'
  },
  { 
    name: 'Productos', 
    href: '/dashboard/products', 
    icon: Package,
    description: 'Gestión de productos'
  },
  { 
    name: 'Categorías', 
    href: '/dashboard/categories', 
    icon: FolderTree,
    description: 'Categorías y clasificaciones'
  },
  { 
    name: 'Fabricantes', 
    href: '/dashboard/manufacturers', 
    icon: Factory,
    description: 'Gestión de fabricantes'
  },
  { 
    name: 'Inventario', 
    href: '/dashboard/inventory', 
    icon: Warehouse,
    description: 'Control de inventario'
  },
  { 
    name: 'Proveedores', 
    href: '/dashboard/suppliers', 
    icon: Building,
    description: 'Gestión de proveedores'
  },
  // NUEVO: Módulo de Países unificado
  { 
    name: 'Países', 
    href: '/dashboard/countries', 
    icon: Globe,
    description: 'Países y monedas'
  },
  { 
    name: 'Órdenes', 
    href: '/dashboard/orders', 
    icon: ShoppingCart,
    description: 'Gestión de pedidos'
  },
  { 
    name: 'Clientes', 
    href: '/dashboard/customers', 
    icon: Users,
    description: 'Gestión de clientes'
  },
  { 
    name: 'Importar', 
    href: '/dashboard/import', 
    icon: Upload,
    description: 'Importación de datos'
  },
  { 
    name: 'Reportes', 
    href: '/dashboard/reports', 
    icon: BarChart3,
    description: 'Reportes y análisis'
  },
  { 
    name: 'Documentos', 
    href: '/dashboard/documents', 
    icon: FileText,
    description: 'Gestión documental'
  },
];

const settingsNavigation = [
  { 
    name: 'Configuración', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'Configuración del sistema'
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Cerrar sidebar en mobile al cambiar ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Cerrar sidebar en mobile al redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MB';

  const getVerificationLevelText = (level?: string) => {
    const levels: { [key: string]: string } = {
      'admin': 'Administrador',
      'user': 'Usuario',
      'viewer': 'Solo lectura'
    };
    return levels[level || 'user'] || 'Usuario';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  };

  const NavItem = ({ item, isSettings = false }: { item: any; isSettings?: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center px-3 py-3 rounded-lg transition-all duration-200 relative",
          isActive
            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          isCollapsed ? "justify-center" : "justify-start"
        )}
        onMouseEnter={() => setActiveTooltip(item.name)}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <item.icon className={cn(
          "flex-shrink-0 transition-colors",
          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
          isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
        )} />
        
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate">{item.name}</span>
            <span className="text-xs text-gray-500 block truncate">{item.description}</span>
          </div>
        )}

        {/* Tooltip para modo colapsado */}
        {isCollapsed && activeTooltip === item.name && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50">
            {item.name}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-md">
            MB
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">MedBay</div>
            <div className="text-xs text-gray-500">Medical Marketplace</div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700",
          isCollapsed ? "justify-center px-2 h-16" : "justify-between px-4 h-16"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-white font-bold">
                MB
              </div>
              <div>
                <div className="text-white font-bold text-lg">MedBay</div>
                <div className="text-blue-100 text-xs">Medical Marketplace</div>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-white font-bold">
              MB
            </div>
          )}

          {/* Toggle collapse button (solo desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden md:flex items-center justify-center rounded-lg transition-colors",
              isCollapsed ? "h-8 w-8 hover:bg-white/20" : "h-8 w-8 hover:bg-blue-500"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white" />
            )}
          </button>

          {/* Close button (mobile) */}
          <button
            className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-white hover:bg-white/20 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className={cn(
          "border-b border-gray-200 bg-white",
          isCollapsed ? "px-2 py-4" : "px-4 py-4"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed ? "justify-center" : "justify-start"
          )}>
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {getVerificationLevelText(user?.verification_level)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </nav>

        {/* Settings Section */}
        <div className="border-t border-gray-200 px-3 py-4 space-y-1">
          {settingsNavigation.map((item) => (
            <NavItem key={item.name} item={item} isSettings={true} />
          ))}
        </div>

        {/* User menu footer */}
        <div className={cn(
          "border-t border-gray-200 bg-gray-50",
          isCollapsed ? "px-2 py-3" : "px-4 py-4"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed && (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <User className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                  <span>Perfil</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-600 transition-colors group"
                >
                  <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-500" />
                  <span>Salir</span>
                </button>
              </>
            )}

            {isCollapsed && (
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white transition-colors"
                  onMouseEnter={() => setActiveTooltip('Perfil')}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <User className="h-4 w-4" />
                  {activeTooltip === 'Perfil' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50">
                      Perfil
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white transition-colors"
                  onMouseEnter={() => setActiveTooltip('Salir')}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <LogOut className="h-4 w-4" />
                  {activeTooltip === 'Salir' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap z-50">
                      Salir
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Layout spacing */}
      <div className={cn(
        "hidden md:block transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )} />
    </>
  );
}