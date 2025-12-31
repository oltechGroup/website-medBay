// frontend/src/components/features/contact/InboxSystem.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { 
  Mail, Check, Trash2, RefreshCcw, Bell, Filter, 
  FileText, MessageSquare, UserPlus, Search, Calendar 
} from 'lucide-react';
import NotificationModal from './NotificationModal';

// Definición de tipos para TypeScript
interface Notification {
  id: number;
  type: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  content: any; // JSONB
  created_at: string;
  is_read?: boolean;
}

type FilterType = 'all' | 'Solicitud de Cotización' | 'Contacto General' | 'Registro Usuario';

export default function InboxSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  
  // Estados de Filtro
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSelectedNotif(null);
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredNotifications = notifications.filter(n => {
    const matchesType = activeFilter === 'all' || n.type === activeFilter;
    const matchesSearch = n.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // --- CONFIGURACIÓN DE ESTILOS POR TIPO ---
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Solicitud de Cotización':
        return { 
          icon: <FileText size={18} />, 
          bg: 'bg-blue-50', 
          text: 'text-blue-700', 
          border: 'border-l-blue-500',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'Registro Usuario':
        return { 
          icon: <UserPlus size={18} />, 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-l-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      default: // Contacto General
        return { 
          icon: <MessageSquare size={18} />, 
          bg: 'bg-purple-50', 
          text: 'text-purple-700', 
          border: 'border-l-purple-500',
          badge: 'bg-purple-100 text-purple-800'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Título y Contador */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-slate-900" size={24} />
            Bandeja de Entrada
            {notifications.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm animate-pulse">
                {notifications.length} Nuevos
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestiona las solicitudes pendientes.</p>
        </div>

        {/* Buscador y Refresh */}
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar remitente..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 w-full md:w-64 transition-all"
             />
           </div>
           <button onClick={fetchNotifications} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
             <RefreshCcw size={18} />
           </button>
        </div>
      </div>

      {/* TABS DE FILTRO */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'Todos', icon: <Filter size={14}/> },
          { id: 'Solicitud de Cotización', label: 'Cotizaciones', icon: <FileText size={14}/> },
          { id: 'Registro Usuario', label: 'Registros', icon: <UserPlus size={14}/> },
          { id: 'Contacto General', label: 'Mensajes', icon: <MessageSquare size={14}/> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as FilterType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
              ${activeFilter === tab.id 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* LISTA DE NOTIFICACIONES */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-500 font-medium text-lg">No hay mensajes en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredNotifications.map((notif) => {
            const styles = getTypeStyles(notif.type);
            
            return (
              <div 
                key={notif.id}
                onClick={() => setSelectedNotif(notif)}
                className={`group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden border-l-4 ${styles.border}`}
              >
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                    {styles.icon} {notif.type}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">
                    <Calendar size={12} />
                    {new Date(notif.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Contenido Card */}
                <div className="mb-4">
                   <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                     {notif.subject}
                   </h3>
                   <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                        {notif.sender_name.charAt(0)}
                      </div>
                      <p className="text-sm text-slate-500 font-medium truncate">{notif.sender_name}</p>
                   </div>
                </div>

                {/* Footer Card */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-1.5 text-xs text-slate-400 max-w-[70%]">
                      <Mail size={12} />
                      <span className="truncate">{notif.sender_email}</span>
                   </div>
                   
                   {/* Botón Borrar Rápido */}
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDelete(notif.id);
                     }}
                     className="w-8 h-8 rounded-full bg-white border border-slate-100 text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-500 flex items-center justify-center transition-all shadow-sm opacity-0 group-hover:opacity-100"
                     title="Marcar como completado"
                   >
                     <Check size={16} />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detallado */}
      <NotificationModal 
        isOpen={!!selectedNotif}
        data={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onConfirmRead={() => selectedNotif && handleDelete(selectedNotif.id)}
      />
    </div>
  );
}