//frontend/src/components/layout/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, Heart, LogOut, User, 
  LayoutDashboard, ChevronDown, Package, 
  Settings, Menu, X 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { ClientSearch } from "@/components/features/products/client/ClientSearch"; 

interface HeaderProps {
  variant?: 'default' | 'catalog';
}

export default function Header({ variant = 'default' }: HeaderProps) {
  // --- HOOKS & ESTADOS ---
  const { user, isAuthenticated, logout } = useAuth();
  const { summary } = useCart(); 
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // --- EFECTOS ---
  
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HELPERS ---

  // Badge de Rol Visual (Usando verification_level)
  const getRoleBadge = (level: string) => {
    switch (level) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 tracking-wider">ADMIN</span>;
      case 'medical_professional':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 tracking-wider">MÉDICO</span>;
      case 'business_verified':
        return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 tracking-wider">EMPRESA</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 tracking-wider">USUARIO</span>;
    }
  };

  // Enlaces de Navegación Central
  const navLinks = [
    { name: 'Catálogo', href: '/products' },
    { name: 'Características', href: '/Characteristics' },
    { name: 'Nosotros', href: '/About' },
    { name: 'Contacto', href: '/Contact' },
  ];

  return (
    <header 
      className={`fixed top-0 inset-x-0 z-[60] transition-all duration-300 border-b 
        ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-gray-200 py-3' : 'bg-white/80 backdrop-blur-md border-gray-100 py-4'}
      `}
    >
      <div className="w-[90%] max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        
        {/* 1. LOGO */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <img src="/icons/logomed.png" alt="Logo MedBay" className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105" />
          <div className="flex text-2xl font-bold leading-none tracking-tight">
            <span className="text-blue-500">Med</span><span className="text-slate-700">Bay</span>
          </div>
        </Link>

        {/* 2. NAVEGACIÓN CENTRAL (O BUSCADOR) */}
        <div className="hidden lg:flex flex-1 justify-center px-8">
          {variant === 'catalog' ? (
            <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-300">
               <ClientSearch /> 
            </div>
          ) : (
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-bold transition-colors relative group
                    ${pathname === link.href ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}
                  `}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full ${pathname === link.href ? 'w-full' : ''}`}></span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* 3. ÁREA DE ACCIONES (DERECHA) */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          
          <Link href="/wishlist" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors" title="Lista de Deseos">
            <Heart size={22} strokeWidth={2} />
          </Link>

          <Link href="/cart" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors relative" title="Carrito de Compras">
            <ShoppingCart size={22} strokeWidth={2} />
            {mounted && summary?.totalItems > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm animate-in zoom-in">
                {summary.totalItems}
              </span>
            )}
          </Link>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* MENÚ DE USUARIO / LOGIN */}
          {mounted && isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              
              {/* Botón Trigger del Menú */}
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl transition-all border
                  ${isUserMenuOpen ? 'bg-slate-50 border-blue-200 ring-2 ring-blue-100' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}
                `}
              >
                <div className="hidden text-right md:block">
                  <p className="text-xs font-bold text-slate-700 leading-tight">
                    {user.full_name?.split(' ')[0] || 'Usuario'} 
                  </p>
                  {/* ✅ AQUÍ ESTABA EL ERROR: Ahora usamos verification_level */}
                  <div className="flex justify-end">{getRoleBadge(user.verification_level)}</div>
                </div>
                <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md">
                  <User size={18} />
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    
                    {/* ✅ AQUÍ TAMBIÉN: Usamos verification_level */}
                    {user.verification_level === 'admin' && (
                      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-blue-600 transition-colors shadow-md mb-2">
                        <LayoutDashboard size={16} />
                        Panel Administrativo
                      </Link>
                    )}

                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                      <Settings size={16} className="text-slate-400" />
                      Mi Perfil y Datos
                    </Link>
                    
                    <Link href="/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                      <Package size={16} className="text-slate-400" />
                      Mis Pedidos
                    </Link>
                  </div>

                  <div className="p-2 border-t border-slate-100">
                    <button 
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-blue-600 px-2 transition-colors">
                Ingresar
              </Link>
              <Link href="/register" className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25">
                Registro
              </Link>
            </div>
          )}

          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>

        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
           {variant === 'catalog' && (
             <div className="mb-2"><ClientSearch /></div>
           )}
           {navLinks.map(link => (
             <Link 
               key={link.name} 
               href={link.href}
               className="text-sm font-bold text-slate-600 py-2 border-b border-slate-50"
               onClick={() => setIsMobileMenuOpen(false)}
             >
               {link.name}
             </Link>
           ))}
        </div>
      )}
    </header>
  );
}