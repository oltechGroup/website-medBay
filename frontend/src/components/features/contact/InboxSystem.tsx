// frontend/src/components/features/contact/InboxSystem.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { 
  Mail, Check, RefreshCcw, Bell, Filter, 
  FileText, MessageSquare, UserPlus, Search, Calendar,
  ShoppingCart, MessageSquareQuote, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api'; 
import NotificationModal from './NotificationModal';

// Definición de tipos
export interface InboxItem {
  id: string;
  original_id: string;
  type: string;        
  source: 'notification' | 'order' | 'quote';
  sender_name: string;
  sender_email: string;
  subject: string;
  created_at: string;
  status?: string;
  data: any;
}

// ✅ NUEVO TIPO DE FILTRO: Incluye 'register' y 'message' por separado
type FilterType = 'all' | 'quote' | 'order' | 'message' | 'register';

export default function InboxSystem() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  
  // Estados de Filtro
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. CARGAR DATOS
  const fetchInbox = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/inbox');
      setItems(data);
    } catch (error) {
      console.error("Error fetching inbox", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // 2. BORRAR
  const handleDelete = async (id: string, source: string) => {
    if (source !== 'notification') return; 
    
    try {
      await api.delete(`/dashboard/inbox/${source}/${id}`);
      setItems(prev => prev.filter(n => n.id !== id));
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting item", error);
    }
  };

  // 3. LÓGICA DE FILTRADO MEJORADA
  const filteredItems = items.filter(item => {
    let matchesType = false;

    if (activeFilter === 'all') {
      matchesType = true;
    } else if (activeFilter === 'order') {
      matchesType = item.source === 'order';
    } else if (activeFilter === 'quote') {
      matchesType = item.source === 'quote';
    } else if (activeFilter === 'register') {
      // Solo registros de usuario
      matchesType = item.type === 'Registro Usuario';
    } else if (activeFilter === 'message') {
      // Todo lo que sea notificación PERO NO sea registro
      matchesType = item.source === 'notification' && item.type !== 'Registro Usuario';
    }

    const matchesSearch = 
      item.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sender_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // 4. ESTILOS VISUALES
  const getItemStyles = (item: InboxItem) => {
    // Órdenes
    if (item.source === 'order') {
      return {
        icon: <ShoppingCart size={18} />,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800'
      };
    }
    // Cotizaciones
    if (item.source === 'quote') {
      return {
        icon: <MessageSquareQuote size={18} />,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-l-amber-500',
        badge: 'bg-amber-100 text-amber-800'
      };
    }
    // Registros
    if (item.type === 'Registro Usuario') {
      return { 
        icon: <UserPlus size={18} />, 
        bg: 'bg-indigo-50', 
        text: 'text-indigo-700', 
        border: 'border-l-indigo-500',
        badge: 'bg-indigo-100 text-indigo-800' 
      };
    }
    // Mensajes Generales
    return { 
      icon: <MessageSquare size={18} />, 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      border: 'border-l-blue-500',
      badge: 'bg-blue-100 text-blue-800' 
    };
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-slate-900" size={24} />
            Centro de Actividad
            {items.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm animate-pulse">
                {items.length} Pendientes
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestiona solicitudes y mensajes.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 w-full md:w-64 transition-all"
             />
           </div>
           <button onClick={fetchInbox} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
             <RefreshCcw size={18} />
           </button>
        </div>
      </div>

      {/* ✅ FILTROS ACTUALIZADOS CON 'REGISTROS' */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'Todo', icon: <Filter size={14}/> },
          { id: 'order', label: 'Órdenes', icon: <ShoppingCart size={14}/> },
          { id: 'quote', label: 'Cotizaciones', icon: <MessageSquareQuote size={14}/> },
          { id: 'register', label: 'Registros', icon: <UserPlus size={14}/> }, // Nuevo botón
          { id: 'message', label: 'Mensajes', icon: <Mail size={14}/> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as FilterType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
              ${activeFilter === tab.id 
                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-500 font-medium text-lg">No hay actividades en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const styles = getItemStyles(item);
            
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden border-l-4 ${styles.border}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                    {styles.icon} {item.type}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">
                    <Calendar size={12} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Contenido */}
                <div className="mb-4">
                   <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                     {item.subject}
                   </h3>
                   <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                        {item.sender_name?.charAt(0) || '?'}
                      </div>
                      <p className="text-sm text-slate-500 font-medium truncate">{item.sender_name || 'Desconocido'}</p>
                   </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-1.5 text-xs text-slate-400 max-w-[70%]">
                      <Mail size={12} />
                      <span className="truncate">{item.sender_email}</span>
                   </div>
                   
                   <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                      {item.source === 'notification' ? <Check size={18} /> : <ChevronRight size={18} />}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <NotificationModal 
          isOpen={!!selectedItem}
          data={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirmRead={() => handleDelete(selectedItem.id, selectedItem.source)}
        />
      )}
    </div>
  );
}