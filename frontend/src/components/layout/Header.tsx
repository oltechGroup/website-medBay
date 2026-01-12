// frontend/src/components/layout/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, Heart, LogOut, User, 
  LayoutDashboard, ChevronDown, Package, 
  Settings, Menu, X, Bell, Stethoscope, 
  Building2, ShieldCheck, Store, Briefcase, 
  MessageSquareQuote, Trash2, Search
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useAdminNotifications } from "@/hooks/useAdminNotifications"; 
import { useClientNotifications } from "@/hooks/useClientNotifications"; 
import { ClientSearch } from "@/components/features/products/client/ClientSearch"; 
import NotificationModal from "@/components/features/contact/NotificationModal";

interface HeaderProps {
  variant?: 'default' | 'catalog' | 'dashboard';
  onMenuToggle?: () => void;
  isDesktopCollapsed?: boolean; 
}

export default function Header({ 
  variant = 'default', 
  onMenuToggle,
  isDesktopCollapsed = false 
}: HeaderProps) {
  // --- HOOKS ---
  const { user, isAuthenticated, logout } = useAuth();
  const { summary } = useCart(); 
  const pathname = usePathname();
  
  // Lógica de roles
  const isAdmin = user?.verification_level === 'admin';
  const isSalesAgent = user?.verification_level === 'sales_agent';
  const isStaff = isAdmin || isSalesAgent;

  // Notificaciones de Admin
  const { 
    notifications: adminNotifs, 
    unreadCount: adminUnread,
    deleteNotification: deleteAdminNotif 
  } = useAdminNotifications();
  
  // Notificaciones de Cliente
  const { 
    notifications: clientNotifs, 
    unreadCount: clientUnread,
    deleteNotification: deleteClientNotif 
  } = useClientNotifications();

  // Determinar datos activos
  const activeNotifications = isStaff ? adminNotifs : clientNotifs;
  const activeUnreadCount = isStaff ? adminUnread : clientUnread;

  // --- ESTADOS ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); 
  const [selectedNotif, setSelectedNotif] = useState<any>(null); 
  const [mounted, setMounted] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // --- EFECTOS ---
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MANEJADORES ---
  const handleDeleteNotification = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation(); 
    if (isStaff) {
      await deleteAdminNotif(Number(id)); 
    } else {
      await deleteClientNotif(String(id)); 
    }
  };

  // --- HELPERS VISUALES ---
  const getRoleBadge = (level?: string) => {
    switch (level) {
      case 'admin':
        return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200 tracking-wider"><ShieldCheck size={10} /> ADMIN</span>;
      case 'sales_agent':
        return <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200 tracking-wider"><Briefcase size={10} /> VENDEDOR</span>;
      case 'medical_professional':
        return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200 tracking-wider"><Stethoscope size={10} /> MÉDICO</span>;
      case 'business_verified':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200 tracking-wider"><Building2 size={10} /> EMPRESA</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 tracking-wider">USUARIO</span>;
    }
  };

  const getPageTitle = () => {
    if (pathname.includes('/products')) return 'Catálogo';
    if (pathname.includes('/orders')) return 'Órdenes';
    if (pathname.includes('/quotes')) return 'Cotizaciones';
    if (pathname.includes('/inventory')) return 'Inventario';
    if (pathname.includes('/customers')) return 'Clientes';
    if (pathname.includes('/settings')) return 'Ajustes';
    return 'Dashboard';
  };

  const dashboardPaddingClass = isDesktopCollapsed ? 'lg:pl-20' : 'lg:pl-64';

  return (
    <>
      <header 
        className={`fixed top-0 z-[60] transition-all duration-300 ease-in-out border-b 
          ${isScrolled || variant === 'dashboard' ? 'bg-white/95 backdrop-blur-md shadow-sm border-gray-200 py-2 sm:py-3' : 'bg-white/80 backdrop-blur-md border-gray-100 py-3 sm:py-4'}
          ${variant === 'dashboard' ? `w-full pr-0 ${dashboardPaddingClass}` : 'inset-x-0'}
        `}
      >
        <div className={`mx-auto flex items-center justify-between gap-2 sm:gap-4 ${variant === 'dashboard' ? 'px-4 sm:px-6 max-w-full' : 'w-[92%] sm:w-[90%] max-w-[1400px]'}`}>
          
          {/* === IZQUIERDA: LOGO O TÍTULO === */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Botón Menú Dashboard (Móvil) */}
            {(variant === 'dashboard') && (
              <button 
                onClick={onMenuToggle} 
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <Menu size={24} />
              </button>
            )}

            {/* Logo (Visible en web pública y en móvil si no es dashboard) */}
            {variant !== 'dashboard' && (
              <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                <img src="/icons/logomed.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-transform group-hover:scale-105" />
                <div className="flex text-xl sm:text-2xl font-bold leading-none tracking-tight">
                  <span className="text-blue-500">Med</span><span className="text-slate-700">Bay</span>
                </div>
              </Link>
            )}

            {/* Título Dinámico (Dashboard) */}
            {variant === 'dashboard' && (
              <div className="flex items-center gap-2 animate-in fade-in duration-300">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">{getPageTitle()}</h1>
              </div>
            )}
          </div>

          {/* === CENTRO: NAVEGACIÓN PÚBLICA (Desktop) === */}
          {variant !== 'dashboard' && (
            <div className="hidden lg:flex flex-1 justify-center px-8">
              {variant === 'catalog' ? (
                <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-300"><ClientSearch /></div>
              ) : (
                <nav className="flex items-center gap-8">
                  {[
                    { label: 'Catálogo', path: '/products' },
                    { label: 'Características', path: '/Characteristics' },
                    { label: 'Nosotros', path: '/About' },
                    { label: 'Contacto', path: '/Contact' }
                  ].map((link) => (
                    <Link 
                      key={link.label} 
                      href={link.path} 
                      className={`text-sm font-bold transition-all relative group py-1
                        ${pathname === link.path ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}
                      `}
                    >
                      {link.label}
                      <span className={`absolute bottom-0 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full ${pathname === link.path ? 'w-full' : ''}`}></span>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          )}

          {/* === DERECHA: ACCIONES Y USUARIO === */}
          <div className="flex items-center gap-1 sm:gap-3 md:gap-4 flex-shrink-0">
            
            {/* Lupa en móvil (Solo si es catálogo) */}
            {variant === 'catalog' && (
               <Link href="/products" className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full">
                  <Search size={22} />
               </Link>
            )}

            {/* 🔔 NOTIFICACIONES (Protegido: Solo si hay usuario) */}
            {mounted && isAuthenticated && user && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors relative"
                >
                  <Bell size={22} />
                  {activeUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-[-60px] sm:right-0 top-full mt-3 w-[85vw] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        {isStaff ? 'Centro de Actividad' : 'Mis Notificaciones'}
                      </h4>
                      {activeUnreadCount > 0 && <span className="text-xs font-bold text-blue-600">{activeUnreadCount} nuevas</span>}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {activeNotifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Sin notificaciones pendientes</div>
                      ) : (
                        activeNotifications.slice(0, 5).map((n: any) => (
                          <div 
                            key={n.id}
                            onClick={() => { setSelectedNotif(n); setIsNotifOpen(false); }}
                            className="relative p-4 border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors group pr-10"
                          >
                            {!n.is_read && (
                              <div className="absolute left-2 top-5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            )}
                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 truncate pl-2">
                              {n.subject || n.title}
                            </p>
                            <div className="flex justify-between mt-1 pl-2">
                              <span className="text-xs text-slate-500 truncate max-w-[140px]">{n.sender_name || 'Sistema MedBay'}</span>
                              <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <button 
                              onClick={(e) => handleDeleteNotification(e, n.id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              title="Borrar notificación"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <Link 
                      href={isStaff ? "/dashboard" : "/notifications"} 
                      className="block p-3 text-center text-xs font-bold text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                      Ver todas
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Iconos Públicos (Carrito y Favoritos) */}
            {variant !== 'dashboard' && (
              <>
                <Link href="/wishlist" className="hidden sm:block p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-red-500 transition-colors"><Heart size={22} strokeWidth={2}/></Link>
                <Link href="/cart" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hover:text-blue-600 transition-colors relative">
                  <ShoppingCart size={22} strokeWidth={2}/>
                  {mounted && summary?.totalItems > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">{summary.totalItems}</span>}
                </Link>
                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
              </>
            )}

            {/* MENÚ DE USUARIO (Dropdown Desktop / Avatar Móvil) */}
            {mounted && isAuthenticated && user ? (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-1 py-1 rounded-xl transition-all border
                    ${isUserMenuOpen ? 'bg-slate-50 border-blue-200 ring-2 ring-blue-100' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}
                  `}
                >
                  <div className="hidden text-right md:flex flex-col items-end">
                    <p className="text-xs font-bold text-slate-700 leading-tight">
                      {user.full_name?.split(' ')[0] || 'Usuario'}
                    </p>
                    {getRoleBadge(user.verification_level)}
                  </div>
                  {/* Avatar más pequeño en móvil */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                    <User size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu (Usuario) */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {/* Mostrar Badge en móvil aquí adentro */}
                      <div className="md:hidden mt-2">{getRoleBadge(user.verification_level)}</div>
                    </div>

                    <div className="p-2 space-y-1">
                      {isStaff ? (
                        <>
                          {variant !== 'dashboard' ? (
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-blue-600 transition-colors shadow-md mb-2">
                              <LayoutDashboard size={16} /> Panel Administrativo
                            </Link>
                          ) : (
                            <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors mb-2">
                              <Store size={16} /> Ir al Sitio Principal
                            </Link>
                          )}
                        </>
                      ) : (
                        <>
                          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                            <Settings size={16} className="text-slate-400" /> Mi Perfil
                          </Link>
                          <Link href="/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                            <Package size={16} className="text-slate-400" /> Mis Pedidos
                          </Link>
                          <Link href="/quotes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                            <MessageSquareQuote size={16} className="text-slate-400" /> Mis Cotizaciones
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button onClick={() => logout()} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-blue-600 px-2 transition-colors">
                  Ingresar
                </Link>
                <Link href="/register" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25 whitespace-nowrap">
                  Registro
                </Link>
              </div>
            )}

            {/* Botón Hamburguesa (Móvil - Solo si NO es dashboard, el dashboard tiene su propio trigger) */}
            {variant !== 'dashboard' && (
              <button 
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg ml-1" 
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24}/>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            📱 MENÚ MÓVIL FULL SCREEN (OVERLAY MEJORADO)
           ========================================================= */}
        {isMobileMenuOpen && variant !== 'dashboard' && (
          <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl lg:hidden flex flex-col animate-in slide-in-from-top-10 duration-300">
             
             {/* Header del Menú Móvil */}
             <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src="/icons/logomed.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                  <span className="text-xl font-bold text-slate-800">Menú</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={24} />
                </button>
             </div>

             {/* Cuerpo del Menú */}
             <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                {variant === 'catalog' && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Búsqueda</p>
                    <ClientSearch />
                  </div>
                )}

                <p className="text-xs font-bold text-slate-400 uppercase mb-2 mt-2">Navegación</p>
                {[
                  { label: 'Catálogo de Productos', path: '/products', icon: <Package size={20}/> },
                  { label: 'Características', path: '/Characteristics', icon: <Settings size={20}/> },
                  { label: 'Nosotros', path: '/About', icon: <User size={20}/> },
                  { label: 'Contacto', path: '/Contact', icon: <MessageSquareQuote size={20}/> }
                ].map((link) => (
                  <Link 
                    key={link.label} 
                    href={link.path}
                    className="flex items-center gap-4 p-4 text-lg font-bold text-slate-700 bg-slate-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                      {link.icon}
                    </div>
                    {link.label}
                  </Link>
                ))}

                {/* Enlaces extra si no hay usuario */}
                {!user && (
                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
                     <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-slate-600 border border-slate-200 rounded-xl">
                        Iniciar Sesión
                     </Link>
                     <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-white bg-slate-900 rounded-xl shadow-lg">
                        Crear Cuenta
                     </Link>
                  </div>
                )}
             </div>
          </div>
        )}
      </header>

      {/* Modal de Notificaciones (Reutilizable) */}
      {selectedNotif && (
        <NotificationModal 
          isOpen={!!selectedNotif}
          data={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onConfirmRead={() => {}}
        />
      )}
    </>
  );
}