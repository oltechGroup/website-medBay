// frontend/src/components/layout/Header.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  ShoppingCart, Heart, LogOut, User, 
  LayoutDashboard, ChevronDown, Package, 
  Settings, Menu, X, Bell, Stethoscope, 
  Building2, ShieldCheck, Store, Briefcase, 
  MessageSquareQuote, Trash2, ChevronRight,
  ArrowRight
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
  const router = useRouter(); // ✅ Necesario para redirección del cliente
  
  const isAdmin = user?.verification_level === 'admin';
  const isSalesAgent = user?.verification_level === 'sales_agent';
  const isStaff = isAdmin || isSalesAgent;

  // Notificaciones (Cargamos condicionalmente)
  const { 
    notifications: adminNotifs, 
    unreadCount: adminUnread,
    deleteNotification: deleteAdminNotif 
  } = useAdminNotifications();
  
  const { 
    notifications: clientNotifs, 
    unreadCount: clientUnread,
    deleteNotification: deleteClientNotif 
  } = useClientNotifications();

  // Seleccionamos la fuente correcta de datos
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
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
  
  // Borrar notificación
  const handleDeleteNotification = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation(); 
    if (isStaff) {
      await deleteAdminNotif(Number(id)); 
    } else {
      await deleteClientNotif(String(id)); 
    }
  };

  // ✅ NUEVO: Manejador Inteligente de Clics en Notificaciones
  const handleNotificationClick = (n: any) => {
    setIsNotifOpen(false); // Cerrar dropdown siempre

    if (isStaff) {
      // 👔 ADMIN: Abrir Modal de Gestión
      setSelectedNotif(n); 
    } else {
      // 👤 CLIENTE: Redirigir a la página correspondiente
      // Los endpoints de cliente devuelven 'order' o 'quote' en el campo type
      if (n.type === 'order') router.push('/orders');
      else if (n.type === 'quote') router.push('/quotes');
      else router.push('/notifications'); // Fallback
    }
  };

  // --- HELPERS VISUALES ---
  const getRoleBadge = (level?: string) => {
    switch (level) {
      case 'admin': return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200 tracking-wider"><ShieldCheck size={10} /> ADMIN</span>;
      case 'sales_agent': return <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200 tracking-wider"><Briefcase size={10} /> VENDEDOR</span>;
      case 'medical_professional': return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200 tracking-wider"><Stethoscope size={10} /> MÉDICO</span>;
      case 'business_verified': return <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200 tracking-wider"><Building2 size={10} /> EMPRESA</span>;
      default: return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 tracking-wider">USUARIO</span>;
    }
  };

  const getPageTitle = () => {
    if (pathname.includes('/products')) return 'Catálogo';
    if (pathname.includes('/orders')) return 'Órdenes';
    if (pathname.includes('/quotes')) return 'Cotizaciones';
    if (pathname.includes('/inventory')) return 'Inventario';
    if (pathname.includes('/customers')) return 'Clientes';
    if (pathname.includes('/settings')) return 'Configuración';
    return 'Panel';
  };

  const dashboardPaddingClass = isDesktopCollapsed ? 'lg:pl-20' : 'lg:pl-64';

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 transition-all duration-300 ease-in-out border-b
          ${variant === 'dashboard' ? 'z-[40]' : 'z-[999]'} 
          ${isScrolled || isMobileMenuOpen || variant === 'dashboard' 
            ? 'bg-white/95 backdrop-blur-xl shadow-sm border-gray-200 py-3' 
            : 'bg-white/80 backdrop-blur-md border-transparent py-4'}
          ${variant === 'dashboard' ? `w-full pr-0 ${dashboardPaddingClass}` : 'w-full'}
        `}
      >
        <div className={`mx-auto flex items-center justify-between gap-3 ${variant === 'dashboard' ? 'px-4 sm:px-6 max-w-full' : 'w-[92%] max-w-[1400px]'}`}>
          
          {/* === IZQUIERDA: LOGO O HAMBURGUESA (DASHBOARD) === */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 md:flex-none">
            {(variant === 'dashboard') && (
              <button onClick={onMenuToggle} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors active:scale-95">
                <Menu size={24} />
              </button>
            )}

            {variant !== 'dashboard' && (
              <Link href="/" className="flex items-center gap-2 group flex-shrink-0 mr-auto md:mr-0 z-50">
                <img src="/icons/logomed.png" alt="Logo" className="w-9 h-9 md:w-10 md:h-10 rounded-lg transition-transform group-hover:scale-105" />
                <div className="flex text-xl md:text-2xl font-bold leading-none tracking-tight">
                  <span className="text-blue-600">Med</span><span className="text-slate-800">Bay</span>
                </div>
              </Link>
            )}

            {variant === 'dashboard' && (
              <div className="flex flex-col md:flex-row md:items-center md:gap-2 animate-in fade-in duration-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider hidden sm:block">Dashboard</span>
                <span className="text-slate-300 hidden sm:block">/</span>
                <h1 className="text-lg font-bold text-slate-800 leading-none">{getPageTitle()}</h1>
              </div>
            )}
          </div>

          {/* === CENTRO: NAVEGACIÓN DESKTOP === */}
          {variant !== 'dashboard' && (
            <div className="hidden lg:flex flex-1 justify-center px-4">
              {variant === 'catalog' ? (
                <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"><ClientSearch /></div>
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
                      <span className={`absolute bottom-0 left-0 h-[2px] bg-blue-600 transition-all duration-300 ${pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          )}

          {/* === DERECHA: ACCIONES Y USUARIO === */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-50">
            
            {/* 🔔 NOTIFICACIONES (INTEGRADO ADMIN / CLIENTE) */}
            {mounted && isAuthenticated && user && (
              <div className="relative" ref={notifRef}>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-xl transition-all relative active:scale-95 ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500 hover:text-blue-600'}`}>
                  <Bell size={20} strokeWidth={2.5} />
                  {activeUnreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-[-60px] md:right-0 top-full mt-4 w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">{isStaff ? 'Centro de Actividad' : 'Mis Notificaciones'}</h4>
                      {activeUnreadCount > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{activeUnreadCount} nuevas</span>}
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {activeNotifications.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3"><Bell className="text-slate-300" size={20}/></div>
                          <p className="text-slate-400 text-sm font-medium">Estás al día</p>
                        </div>
                      ) : (
                        activeNotifications.slice(0, 5).map((n: any) => (
                          // ✅ USO DE handleNotificationClick EN LUGAR DE ABRIR MODAL DIRECTO
                          <div key={n.id} onClick={() => handleNotificationClick(n)} className="relative p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group">
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 truncate">{n.subject || n.title}</p>
                                {/* Admin ve nombre del cliente, Cliente ve sistema */}
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{isStaff ? (n.sender_name || 'Desconocido') : 'Sistema MedBay'}</p>
                                <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
                              </div>
                              <button onClick={(e) => handleDeleteNotification(e, n.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-center"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link href={isStaff ? "/dashboard" : "/notifications"} className="block p-3 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-100">Ver Historial Completo</Link>
                  </div>
                )}
              </div>
            )}

            {/* Iconos Públicos */}
            {variant !== 'dashboard' && (
              <>
                <Link href="/wishlist" className="hidden sm:flex p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-red-500 transition-colors">
                  <Heart size={20} strokeWidth={2.5}/>
                </Link>
                <Link href="/cart" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors relative mr-1">
                  <ShoppingCart size={20} strokeWidth={2.5}/>
                  {mounted && summary?.totalItems > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-white">{summary.totalItems}</span>}
                </Link>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              </>
            )}

            {/* MENÚ DE USUARIO */}
            <div className={variant === 'dashboard' ? 'block' : 'hidden sm:block'}>
              {mounted && isAuthenticated && user ? (
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={`flex items-center gap-3 pl-1 pr-1 py-1 rounded-xl transition-all border ${isUserMenuOpen ? 'bg-slate-50 border-slate-200' : 'hover:bg-slate-50 border-transparent'}`}>
                    <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-md"><User size={18} /></div>
                    <div className="hidden md:block text-left mr-2">
                      <p className="text-xs font-bold text-slate-700 leading-tight">{user.full_name?.split(' ')[0]}</p>
                      <div className="scale-90 origin-left">{getRoleBadge(user.verification_level)}</div>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 bg-slate-50/80 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        {isStaff ? (
                          <>
                            {variant !== 'dashboard' ? <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-blue-600 transition-colors shadow-sm"><LayoutDashboard size={16} /> Panel Admin</Link> : <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"><Store size={16} /> Ir a Tienda</Link>}
                          </>
                        ) : (
                          <>
                            <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"><Settings size={16} /> Mi Perfil</Link>
                            <Link href="/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"><Package size={16} /> Mis Pedidos</Link>
                            <Link href="/quotes" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"><MessageSquareQuote size={16} /> Mis Cotizaciones</Link>
                            <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                              <Heart size={16} /> Mis Favoritos
                            </Link>
                          </>
                        )}
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => logout()} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"><LogOut size={16} /> Cerrar Sesión</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors">Ingresar</Link>
                  <Link href="/register" className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all shadow-md">Registro</Link>
                </div>
              )}
            </div>

            {/* BOTÓN MENÚ MÓVIL PÚBLICO */}
            {variant !== 'dashboard' && (
              <button 
                className="lg:hidden p-2.5 text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors active:scale-95 z-50" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} strokeWidth={2.5}/> : <Menu size={20} strokeWidth={2.5}/>}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MENÚ MÓVIL (Sin cambios, solo para referencia visual) */}
      {isMobileMenuOpen && variant !== 'dashboard' && (
        <div className="lg:hidden fixed inset-0 z-[990] bg-white animate-in slide-in-from-top-10 fade-in duration-200 flex flex-col pt-[72px]">
          <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
            <div className="mb-8 mt-4"><ClientSearch /></div>
            <nav className="flex flex-col gap-3 mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Menú Principal</p>
              {[
                { label: 'Catálogo de Productos', path: '/products', icon: <Package size={20}/>, color: 'text-blue-500' },
                { label: 'Características', path: '/Characteristics', icon: <ShieldCheck size={20}/>, color: 'text-emerald-500' },
                { label: 'Sobre Nosotros', path: '/About', icon: <Building2 size={20}/>, color: 'text-indigo-500' },
                { label: 'Contacto y Soporte', path: '/Contact', icon: <MessageSquareQuote size={20}/>, color: 'text-amber-500' }
              ].map(link => (
                <Link key={link.label} href={link.path} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 active:scale-[0.98] transition-all group" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-4 font-bold text-base text-slate-700 group-hover:text-blue-700">
                    <span className={`${link.color} bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>{link.icon}</span>
                    {link.label}
                  </div>
                  <div className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"><ChevronRight size={18} strokeWidth={2.5} /></div>
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-100 pt-8">
              {mounted && isAuthenticated && user ? (
                <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/10">{user.full_name?.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg leading-tight truncate">{user.full_name}</p>
                      <p className="text-slate-400 text-sm truncate">{user.email}</p>
                      <div className="mt-2 inline-block scale-90 origin-left">{getRoleBadge(user.verification_level)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                    {isStaff ? (
                      <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="col-span-2 bg-blue-600 py-3.5 rounded-xl text-center font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20">Ir al Dashboard</Link>
                    ) : (
                      <>
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="bg-white/10 border border-white/5 py-3 rounded-xl text-center font-medium hover:bg-white/20 transition-colors">Mi Perfil</Link>
                        <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className="bg-white/10 border border-white/5 py-3 rounded-xl text-center font-medium hover:bg-white/20 transition-colors">Pedidos</Link>
                        <Link href="/quotes" onClick={() => setIsMobileMenuOpen(false)} className="bg-white/10 border border-white/5 py-3 rounded-xl text-center font-medium hover:bg-white/20 transition-colors">Cotizaciones</Link>
                        <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="bg-white/10 border border-white/5 py-3 rounded-xl text-center font-medium hover:bg-white/20 transition-colors">Favoritos</Link>
                      </>
                    )}
                  </div>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 text-red-300 hover:text-white font-medium transition-colors relative z-10"><LogOut size={18} /> Cerrar Sesión</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-slate-700 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all">Iniciar Sesión</Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center font-bold text-white bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">Crear Cuenta Gratis <ArrowRight size={18} /></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL SOLO PARA ADMIN (CLIENTE NO LO USA AQUÍ) */}
      {selectedNotif && isStaff && (
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