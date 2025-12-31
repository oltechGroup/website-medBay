// frontend/src/components/features/contact/NotificationModal.tsx

import React, { useState } from 'react';
import { X, Mail, User, CheckCircle2, MessageCircle, FileText, Download, Clock } from 'lucide-react';
import ReplyModal from './ReplyModal'; 
import AdminActions from '../admin/AdminActions'; 

// ✅ Importamos los componentes de detalle (Cotización, Contacto y Registro)
import QuoteDetails from './details/QuoteDetails';
import ContactDetails from './details/ContactDetails';
import RegisterDetails from './details/RegisterDetails'; // <--- NUEVO IMPORT

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRead: () => void;
  data: any; 
}

export default function NotificationModal({ isOpen, onClose, onConfirmRead, data }: ModalProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  if (!isOpen || !data) return null;

  // Parseamos el JSONB que viene de la base de datos
  const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
  
  // Extraemos datos comunes
  const { mensaje, product_details, contact_details, extra_data } = content;
  
  // Detectamos el tipo para renderizado condicional
  const isQuote = data.type === 'Solicitud de Cotización';
  const isContact = data.type === 'Contacto General';
  const isRegistrationRequest = data.type === 'Registro Usuario';

  // Lógica para documentos adjuntos
  const documentUrl = extra_data?.file_path ? `http://localhost:3001${extra_data.file_path}` : null;
  const isPdf = documentUrl?.toLowerCase().endsWith('.pdf');

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white w-full max-w-7xl h-full max-h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          
          {/* === HEADER DEL MODAL === */}
          <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
               <div className={`p-2 rounded-xl border border-slate-100 
                 ${isQuote ? 'bg-blue-50 text-blue-600' : isRegistrationRequest ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}
               `}>
                 {isQuote ? <FileText size={24}/> : <MessageCircle size={24}/>}
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-1">{data.subject}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isQuote ? 'bg-blue-500' : isRegistrationRequest ? 'bg-emerald-500' : 'bg-purple-500'}`}></span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.type}</p>
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>

          {/* === CONTENIDO SCROLLEABLE === */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                
                {/* COLUMNA IZQUIERDA: DATOS DE LA SOLICITUD (45%) */}
                <div className="lg:col-span-5 overflow-y-auto custom-scrollbar bg-slate-50/50 p-8 border-r border-slate-100 text-sm flex flex-col gap-6">
                    
                    {/* 1. Tarjeta de Usuario (Remitente) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><User size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Remitente</p>
                                <h4 className="text-base font-bold text-slate-800">{data.sender_name}</h4>
                            </div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-slate-600"><Mail size={14} className="text-blue-500"/> {data.sender_email}</div>
                           <div className="flex items-center gap-2 text-slate-600"><Clock size={14} className="text-blue-500"/> {new Date(data.created_at).toLocaleString()}</div>
                        </div>
                    </div>

                    {/* 2. CONTENIDO DINÁMICO SEGÚN TIPO */}
                    {isQuote && product_details ? (
                        <QuoteDetails details={product_details} message={mensaje} />
                    ) : isContact ? (
                        <ContactDetails details={contact_details} message={mensaje} />
                    ) : isRegistrationRequest ? (
                        // ✅ AQUI INTEGRAMOS EL NUEVO COMPONENTE DE REGISTRO
                        <RegisterDetails details={extra_data} />
                    ) : null}

                    {/* 3. ACCIONES DEL ADMIN */}
                    <div className="pt-4 border-t border-slate-200 mt-auto">
                        {isRegistrationRequest ? (
                            <AdminActions 
                                userId={extra_data?.user_id}
                                userEmail={data.sender_email}
                                userName={data.sender_name}
                                onActionComplete={() => { onConfirmRead(); onClose(); }}
                            />
                        ) : (
                            <div className="flex gap-3">
                                 <button onClick={onConfirmRead} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
                                   <CheckCircle2 size={18} /> Marcar Leído
                                 </button>
                                 <button onClick={() => setIsReplyOpen(true)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg transition-colors flex items-center justify-center gap-2">
                                   <MessageCircle size={18} /> Responder
                                 </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: DOCUMENTOS / PROVEEDORES (55%) */}
                <div className="lg:col-span-7 bg-slate-100 p-6 flex flex-col h-full relative">
                    
                    <div className="flex items-center justify-between mb-4 z-10">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <FileText size={16} /> {isQuote ? 'Documentación / Ficha Técnica' : 'Archivos Adjuntos'}
                        </h4>
                        {documentUrl && (
                            <a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                <Download size={14} /> Descargar
                            </a>
                        )}
                    </div>
                    
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10">
                        {documentUrl ? (
                            isPdf ? <iframe src={documentUrl} className="w-full h-full" title="Doc"></iframe> : 
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 overflow-auto p-4"><img src={documentUrl} alt="Evidencia" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" /></div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                               <FileText size={64} className="mb-4 opacity-30" />
                               <p className="font-medium">Sin archivos adjuntos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      
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