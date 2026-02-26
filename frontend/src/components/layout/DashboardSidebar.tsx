// frontend/src/components/layout/DashboardSidebar.tsx
'use client';

import React from 'react';
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
  X,
  MessageSquareQuote
} from 'lucide-react';

interface DashboardSidebarProps {
  isOpen: boolean;           // Mobile menu state (Off-canvas)
  onClose: () => void;       // Close mobile menu
  isCollapsed: boolean;      // Collapsed state (Desktop)
  onToggleCollapse: () => void; 
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quotes', href: '/dashboard/quotes', icon: MessageSquareQuote },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderTree },
  { name: 'Manufacturers', href: '/dashboard/manufacturers', icon: Factory },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Warehouse },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: Building },
  { name: 'Countries', href: '/dashboard/countries', icon: Globe },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Import', href: '/dashboard/import', icon: Upload },
  // ✅ CAMBIO REALIZADO: Reports -> Traffic
  { name: 'Traffic', href: '/dashboard/traffic', icon: BarChart3 },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
];

const settingsNav = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar({ 
  isOpen, 
  onClose, 
  isCollapsed, 
  onToggleCollapse 
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // In mobile, we always want to see the full menu and text
  const showFullMenu = isOpen || !isCollapsed;

  // Helper to render items
  const NavItem = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    
    return (
      <Link
        href={item.href}
        onClick={() => {
          // In mobile, close upon click
          if (window.innerWidth < 1024) onClose();
        }}
        className={cn(
          "group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 mb-1 mx-2 relative overflow-hidden",
          isActive
            ? "bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium",
          (!showFullMenu) ? "justify-center px-2" : ""
        )}
        title={!showFullMenu ? item.name : undefined}
      >
        <item.icon 
          className={cn(
            "flex-shrink-0 transition-colors z-10", 
            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600",
            (!showFullMenu) ? "w-6 h-6" : "w-5 h-5 mr-3"
          )} 
        />
        
        {/* Show text if expanded or in mobile */}
        {showFullMenu && (
          <span className="truncate z-10 relative animate-in fade-in duration-200">{item.name}</span>
        )}

        {/* Active side line */}
        {isActive && showFullMenu && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* SIDEBAR CONTAINER */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[70] h-screen bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out flex flex-col",
          "w-72", 
          isCollapsed ? "lg:w-20" : "lg:w-64",
          
          // Mobile Position (Off-canvas logic)
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* === SIDEBAR HEADER === */}
        <div className={cn(
          "flex items-center h-[72px] flex-shrink-0 transition-all duration-300 relative",
          (!showFullMenu) ? "justify-center bg-white" : "justify-between px-6 bg-gradient-to-r from-blue-600 to-blue-700"
        )}>
          
          {/* EXPANDED LOGO */}
          <div className={cn("flex items-center gap-3 transition-opacity duration-200", (!showFullMenu) && "hidden opacity-0")}>
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

          {/* COLLAPSED LOGO */}
          {(!showFullMenu) && (
            <div 
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
              onClick={onToggleCollapse}
              title="Expand menu"
            >
               <img 
                 src="/icons/logomedblanco.png" 
                 alt="MB" 
                 className="w-full h-full object-contain p-2" 
               />
            </div>
          )}

          {/* Close Button (Mobile only) */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors backdrop-blur-sm absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X size={20} />
          </button>
        </div>

        {/* === SCROLLABLE CONTENT === */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8">
          
          {/* Management Group */}
          <div>
            {showFullMenu && (
              <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 animate-in fade-in">
                Management
              </p>
            )}
            <nav className="space-y-0.5">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>

          {/* System Group */}
          <div>
            {showFullMenu && (
              <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 animate-in fade-in">
                System
              </p>
            )}
            <nav className="space-y-0.5">
              {settingsNav.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>

        {/* === SIDEBAR FOOTER === */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          
          {/* Collapsed Case */}
          {(!showFullMenu) ? (
            <button 
              onClick={onToggleCollapse}
              className="w-full flex justify-center p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 text-slate-500 hover:text-blue-600"
              title="Expand menu"
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            // Expanded Case
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center gap-3 px-2 py-1">
                 <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden">
                   {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-slate-800 truncate">{user?.full_name || 'Admin'}</p>
                   <p className="text-[10px] font-bold text-slate-400 truncate tracking-wide">
                     {user?.email}
                   </p>
                 </div>
               </div>

               <div className="flex gap-2">
                  <button 
                    onClick={onToggleCollapse}
                    className="hidden lg:flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={14} /> Hide
                  </button>
                  
                  <button 
                    onClick={() => logout()}
                    className="flex-1 lg:flex-none lg:w-10 flex items-center justify-center py-2.5 text-red-500 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                    title="Logout"
                  >
                    <LogOut size={16} />
                    <span className="lg:hidden ml-2 text-xs font-bold">Logout</span>
                  </button>
               </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}