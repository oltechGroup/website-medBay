//frontend/src/components/layout/DashboardSidebar.tsx
'use client';

import React, { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Productos', href: '/dashboard/products', icon: Package },
  { name: 'Categorías', href: '/dashboard/categories', icon: FolderTree },
  { name: 'Fabricantes', href: '/dashboard/manufacturers', icon: Factory },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Warehouse },
  { name: 'Proveedores', href: '/dashboard/suppliers', icon: Building },
  { name: 'Países', href: '/dashboard/countries', icon: Globe },
  { name: 'Órdenes', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  { name: 'Importar', href: '/dashboard/import', icon: Upload },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Documentos', href: '/dashboard/documents', icon: FileText },
];

const settingsNav = [
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Estado local para colapsar en escritorio (Desktop)
  // false = Expandido por defecto (Texto + Icono)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper para items de navegación
  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    
    return (
      <Link
        href={item.href}
        onClick={() => {
          // En móvil, cerramos el menú al hacer click en un link para ver el contenido
          if (window.innerWidth < 1024) onClose();
        }}
        className={cn(
          "group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 mb-1 mx-2 relative overflow-hidden",
          isActive
            ? "bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium",
          isCollapsed ? "justify-center px-2" : ""
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon 
          className={cn(
            "flex-shrink-0 transition-colors z-10", 
            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600",
            isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
          )} 
        />
        
        {!isCollapsed && (
          <span className="truncate z-10 relative">{item.name}</span>
        )}

        {/* Indicador visual activo (línea lateral) */}
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* SIDEBAR CONTAINER */}
      {/* h-screen y flex-col aseguran que ocupe toda la altura y distribuya el contenido */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[70] h-screen bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out flex flex-col",
          // Ancho dinámico en escritorio
          isCollapsed ? "lg:w-20" : "lg:w-64",
          // Posición en móvil (off-canvas)
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* === HEADER DEL SIDEBAR (Logo) === */}
        <div className={cn(
          "flex items-center h-[72px] flex-shrink-0 transition-all duration-300",
          isCollapsed ? "justify-center bg-white" : "justify-between px-6 bg-gradient-to-r from-blue-600 to-blue-700"
        )}>
          
          {/* Logo Expandido (Imagen Real) */}
          <div className={cn("flex items-center gap-3 transition-opacity duration-200", isCollapsed && "hidden opacity-0")}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
               <img 
                 src="/icons/logomedblanco.png" 
                 alt="MedBay Logo" 
                 className="w-full h-full object-contain p-1.5" 
               />
            </div>
            <div className="flex flex-col text-white leading-none">
              <span className="font-black text-lg tracking-tight">MedBay</span>
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>

          {/* Logo Colapsado (Mini Imagen) */}
          {isCollapsed && (
            <div 
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
              onClick={() => setIsCollapsed(false)}
            >
               <img 
                 src="/icons/logomedblanco.png" 
                 alt="MB" 
                 className="w-full h-full object-contain p-2" 
               />
            </div>
          )}

          {/* Botón Cerrar (Solo visible en Móvil) */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* === CONTENIDO SCROLLEABLE (Menú) === */}
        {/* flex-1 y overflow-y-auto hacen que SOLO esta parte tenga scroll si la pantalla es pequeña */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8">
          
          {/* Grupo Gestión */}
          <div>
            {!isCollapsed && (
              <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Gestión
              </p>
            )}
            <nav className="space-y-0.5">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>

          {/* Grupo Sistema */}
          <div>
            {!isCollapsed && (
              <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Sistema
              </p>
            )}
            <nav className="space-y-0.5">
              {settingsNav.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>

        {/* === FOOTER DEL SIDEBAR (Perfil & Colapso) === */}
        {/* flex-shrink-0 asegura que el footer siempre esté visible abajo y no se aplaste */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          {isCollapsed ? (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 text-slate-500 hover:text-blue-600"
              title="Expandir menú"
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
               {/* Tarjeta Usuario */}
               <div className="flex items-center gap-3 px-2 py-1">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden">
                    {/* Si quieres foto real, ponla aquí. Si no, inicial: */}
                    {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate tracking-wide">{user?.email}</p>
                  </div>
               </div>

               {/* Botones Acción */}
               <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCollapsed(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={14} /> Ocultar
                  </button>
                  <button 
                    onClick={() => logout()}
                    className="w-10 flex items-center justify-center py-2.5 text-red-500 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={16} />
                  </button>
               </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}