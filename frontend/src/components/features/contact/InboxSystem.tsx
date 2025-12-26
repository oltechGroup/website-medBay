// frontend/src/components/features/contact/InboxSystem.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { Mail, Check, Trash2, RefreshCcw, Bell } from 'lucide-react';
import NotificationModal from './NotificationModal';

interface Notification {
  id: number;
  type: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  content: any; // JSONB
  created_at: string;
}

export default function InboxSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

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
      // Actualizamos la UI localmente para que sea instantáneo
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSelectedNotif(null); // Cerrar modal si estaba abierto
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="text-blue-500" />
          Bandeja de Entrada
          {notifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>
          )}
        </h2>
        <button onClick={fetchNotifications} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Refrescar">
          <RefreshCcw size={18} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Cargando notificaciones...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-500 font-medium">¡Todo limpio! No tienes mensajes pendientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => setSelectedNotif(notif)}
              className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                  ${notif.type === 'Contact' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}
                `}>
                  {notif.type}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{notif.subject}</h3>
              <p className="text-sm text-slate-500 mb-4">{notif.sender_name}</p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail size={14} />
                    <span className="truncate max-w-[120px]">{notif.sender_email}</span>
                 </div>
                 
                 {/* Botón rápido de "Leído" (sin abrir modal) */}
                 <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar abrir el modal
                      handleDelete(notif.id);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600 flex items-center justify-center transition-colors"
                    title="Marcar como leído y borrar"
                 >
                   <Check size={16} />
                 </button>
              </div>
            </div>
          ))}
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