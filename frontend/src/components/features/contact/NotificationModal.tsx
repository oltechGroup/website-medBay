// frontend/src/components/features/contact/NotificationModal.tsx
import React, { useState } from 'react';
import { X, Calendar, Mail, User, CheckCircle2, MessageCircle } from 'lucide-react';
import ReplyModal from './ReplyModal'; // <--- Importamos el nuevo componente

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRead: () => void;
  data: any; 
}

export default function NotificationModal({ isOpen, onClose, onConfirmRead, data }: ModalProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false); // Estado para abrir el modal de respuesta

  if (!isOpen || !data) return null;

  const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
  const { mensaje, extra_data } = content;

  return (
    <>
      {/* --- MODAL PRINCIPAL (DETALLES) --- */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        {/* Contenido */}
        <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
               <img src="/icons/logomed.png" alt="MedBay" className="w-10 h-10 rounded-lg" />
               <div>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-1">{data.subject}</h3>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{data.type}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {/* Info del Remitente */}
            <div className="flex flex-wrap gap-6 mb-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-500" />
                <span className="font-semibold text-slate-700">{data.sender_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-500" />
                <span className="font-semibold text-slate-700">{data.sender_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" />
                <span>{new Date(data.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Mensaje Principal */}
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Mensaje del Usuario</h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {mensaje || "Sin mensaje de texto."}
              </p>
            </div>

            {/* Datos Extra */}
            {extra_data && Object.keys(extra_data).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detalles Adicionales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(extra_data).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{key.replace(/_/g, ' ')}</span>
                      <span className="block text-slate-800 font-semibold truncate" title={String(value)}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0">
            <button 
              onClick={onConfirmRead}
              className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-200 hover:text-red-500 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Solo Marcar Leído
            </button>
            
            {/* Nuevo Botón: RESPONDER */}
            <button 
              onClick={() => setIsReplyOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle size={18} />
              Responder
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DE RESPUESTA (Se monta encima si isReplyOpen es true) --- */}
      <ReplyModal 
        isOpen={isReplyOpen}
        onClose={() => setIsReplyOpen(false)}
        recipientName={data.sender_name}
        recipientEmail={data.sender_email}
        originalSubject={data.subject}
      />
    </>
  );
}