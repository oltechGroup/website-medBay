// frontend/src/app/notifications/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useClientNotifications, ClientNotification } from "@/hooks/useClientNotifications";
import { 
  Bell, Package, FileText, ChevronRight, 
  Filter, CheckCircle2, Clock, AlertTriangle, 
  ArrowRight, Loader2, Inbox
} from "lucide-react";

export default function NotificationsPage() {
  const { notifications, isLoading } = useClientNotifications();
  const [filter, setFilter] = useState<'all' | 'order' | 'quote'>('all');

  // --- LÓGICA DE FILTRADO ---
  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  // --- HELPERS VISUALES ---
  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package size={24} />;
      case 'quote': return <FileText size={24} />;
      default: return <Bell size={24} />;
    }
  };

  const getTheme = (type: string, message: string) => {
    // Definimos colores según la urgencia o tipo
    if (message.includes('Rechazado') || message.includes('Cancelada')) return 'bg-red-100 text-red-600 border-red-200';
    if (message.includes('Aprobado') || message.includes('Propuesta')) return 'bg-green-100 text-green-600 border-green-200';
    if (type === 'quote') return 'bg-blue-100 text-blue-600 border-blue-200';
    return 'bg-amber-100 text-amber-600 border-amber-200'; // Default pending
  };

  const getActionLink = (n: ClientNotification) => {
    if (n.type === 'order') return `/orders/${n.id}`;
    if (n.type === 'quote') return `/quotes/${n.id}`;
    return '#';
  };

  const getActionLabel = (n: ClientNotification) => {
    if (n.message.includes('Propuesta')) return 'Revisar Propuesta';
    if (n.message.includes('Stock Aprobado')) return 'Proceder al Pago';
    if (n.message.includes('Enviado')) return 'Rastrear Paquete';
    return 'Ver Detalles';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 md:pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Bell className="text-blue-600" size={32} /> Centro de Actividad
            </h1>
            <p className="text-slate-500 mt-1">
              Aquí encontrarás actualizaciones importantes sobre tus pedidos y cotizaciones que requieren tu atención.
            </p>
          </div>
          
          {/* ESTADÍSTICAS RÁPIDAS (Opcional) */}
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              {notifications.length} Pendientes
            </span>
          </div>
        </div>

        {/* TABS DE FILTRO */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <button 
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
              ${filter === 'all' 
                ? 'bg-slate-800 text-white shadow-md transform scale-105' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Filter size={14}/> Todas
          </button>
          <button 
            onClick={() => setFilter('order')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
              ${filter === 'order' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600'}`}
          >
            <Package size={14}/> Pedidos
          </button>
          <button 
            onClick={() => setFilter('quote')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
              ${filter === 'quote' 
                ? 'bg-emerald-600 text-white shadow-md transform scale-105' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
          >
            <FileText size={14}/> Cotizaciones
          </button>
        </div>

        {/* LISTA DE NOTIFICACIONES */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : filteredNotifs.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifs.map((notif) => (
              <div 
                key={`${notif.type}-${notif.id}`} 
                className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
              >
                {/* Barra lateral de color según estado */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getTheme(notif.type, notif.message).split(' ')[0].replace('bg-', 'bg-')}`}></div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pl-3">
                  
                  {/* ICONO Y CONTENIDO */}
                  <div className="flex gap-4 items-start flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTheme(notif.type, notif.message)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${notif.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {notif.type === 'order' ? 'Pedido' : 'Cotización'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12}/> {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                        {notif.subject}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* BOTÓN DE ACCIÓN */}
                  <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <Link 
                      href={getActionLink(notif)}
                      className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 hover:scale-105 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                      {getActionLabel(notif)} <ArrowRight size={16}/>
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ESTADO VACÍO */
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Inbox size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¡Todo al día!</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              No tienes alertas pendientes. Cuando realices un pedido o solicites una cotización, verás las actualizaciones aquí.
            </p>
            <div className="mt-8">
              <Link href="/products" className="text-blue-600 font-bold hover:underline">
                Explorar Catálogo
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}