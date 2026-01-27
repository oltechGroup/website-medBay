// frontend/src/app/notifications/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useClientNotifications, ClientNotification } from "@/hooks/useClientNotifications";
import { 
  Bell, Package, FileText, ChevronRight, 
  Filter, Clock, ArrowRight, Loader2, Inbox,
  DollarSign, Truck, AlertTriangle
} from "lucide-react";

export default function NotificationsPage() {
  const { notifications, isLoading } = useClientNotifications();
  const [filter, setFilter] = useState<'all' | 'order' | 'quote'>('all');

  // --- LÓGICA DE FILTRADO ---
  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  // --- HELPERS VISUALES (Actualizados para B2B) ---
  const getIcon = (type: string, subject: string) => {
    if (subject.includes('Propuesta')) return <DollarSign size={24} />;
    if (subject.includes('Enviado')) return <Truck size={24} />;
    
    switch (type) {
      case 'order': return <Package size={24} />;
      case 'quote': return <FileText size={24} />;
      default: return <Bell size={24} />;
    }
  };

  const getTheme = (type: string, message: string, subject: string) => {
    // Colores según urgencia
    if (subject.includes('Cancelada') || message.includes('Rechazado')) 
      return 'bg-red-50 text-red-600 border-l-4 border-red-500';
    
    if (subject.includes('Propuesta') || message.includes('calculado envío')) 
      return 'bg-sky-50 text-sky-700 border-l-4 border-sky-500 shadow-sky-100'; // Azul para cotización lista
    
    if (subject.includes('Stock Aprobado') || subject.includes('Enviado')) 
      return 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500';
    
    return 'bg-white text-slate-600 border border-slate-200'; // Default
  };

  const getActionLink = (n: ClientNotification) => {
    // Siempre redirigimos a la lista correspondiente para abrir el modal
    if (n.type === 'order') return '/orders'; 
    if (n.type === 'quote') return '/quotes';
    return '#';
  };

  const getActionLabel = (n: ClientNotification) => {
    const subject = n.subject || '';
    if (subject.includes('Propuesta')) return 'Revisar y Pagar';
    if (subject.includes('Stock Aprobado')) return 'Subir Pago';
    if (subject.includes('Enviado')) return 'Ver Rastreo';
    return 'Ver Detalles';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 md:pt-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Bell className="text-blue-600" size={28} /> Notificaciones
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Actualizaciones sobre tus solicitudes y envíos.
            </p>
          </div>
          
          {/* Contador */}
          {!isLoading && notifications.length > 0 && (
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600">{notifications.length} Nuevas</span>
            </div>
          )}
        </div>

        {/* FILTROS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter('order')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filter === 'order' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setFilter('quote')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filter === 'quote' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            Cotizaciones
          </button>
        </div>

        {/* LISTA DE NOTIFICACIONES */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : filteredNotifs.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifs.map((notif) => {
              const themeClass = getTheme(notif.type, notif.message, notif.subject);
              
              return (
                <div 
                  key={`${notif.type}-${notif.id}`} 
                  className={`group relative p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${themeClass}`}
                >
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    
                    {/* Contenido */}
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm shadow-sm text-slate-700">
                        {getIcon(notif.type, notif.subject)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                            {notif.type === 'order' ? 'Pedido' : 'Cotización'}
                          </span>
                          <span className="text-[10px] opacity-40 flex items-center gap-1">
                            • {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight">
                          {notif.subject}
                        </h3>
                        <p className="text-sm opacity-80 mt-1 max-w-lg">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    {/* Botón de Acción */}
                    <Link 
                      href={getActionLink(notif)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                    >
                      {getActionLabel(notif)} <ArrowRight size={14}/>
                    </Link>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ESTADO VACÍO */
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Inbox size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">Sin notificaciones</h3>
            <p className="text-slate-400 text-sm">Te avisaremos cuando haya actualizaciones.</p>
          </div>
        )}

      </div>
    </div>
  );
}