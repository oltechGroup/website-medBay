// frontend/src/components/features/contact/NotificationModal.tsx

import React, { useState } from 'react';
import { X, Calendar, Mail, User, CheckCircle2, MessageCircle, FileText, Download, Building2, MapPin, Hash, Phone } from 'lucide-react';
import ReplyModal from './ReplyModal'; 
import AdminActions from '../admin/AdminActions'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRead: () => void;
  data: any; 
}

export default function NotificationModal({ isOpen, onClose, onConfirmRead, data }: ModalProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  if (!isOpen || !data) return null;

  const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
  const { mensaje, extra_data } = content;
  const isRegistrationRequest = data.type === 'Registro Usuario' && extra_data?.user_id;
  const documentUrl = extra_data?.file_path ? `http://localhost:3001${extra_data.file_path}` : null;
  const isPdf = documentUrl?.toLowerCase().endsWith('.pdf');

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white w-full max-w-7xl h-full max-h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          
          {/* HEADER */}
          <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
               <div className="bg-slate-50 p-2 rounded-xl border border-slate-100"><img src="/icons/logomed.png" alt="MedBay" className="w-8 h-8 object-contain" /></div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-1">{data.subject}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.type}</p>
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                
                {/* COLUMNA IZQUIERDA: DATOS (40%) */}
                <div className="lg:col-span-5 overflow-y-auto custom-scrollbar bg-slate-50/50 p-8 border-r border-slate-100 text-sm">
                    
                    {/* 1. Solicitante */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-3">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><User size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Solicitante</p>
                                <h4 className="text-base font-bold text-slate-800">{data.sender_name}</h4>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                           <div className="flex items-center gap-2 text-slate-600"><Mail size={14} className="text-blue-500"/> {data.sender_email}</div>
                           {/* Muestra teléfono si existe en extra_data */}
                           {extra_data.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={14} className="text-blue-500"/> {extra_data.phone}</div>}
                           <div className="flex items-center gap-2 text-slate-600"><Calendar size={14} className="text-blue-500"/> {new Date(data.created_at).toLocaleString()}</div>
                        </div>
                    </div>

                    {/* 2. Datos Fiscales (RFC, Empresa) */}
                    {extra_data && (
                         <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 size={14}/> Datos Fiscales</h4>
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {extra_data.company && extra_data.company !== 'N/A' && (
                                  <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                                      <span className="text-slate-500 font-medium">Razón Social</span>
                                      <span className="font-bold text-slate-800 text-right">{extra_data.company}</span>
                                  </div>
                                )}
                                <div className="p-3 flex justify-between items-center bg-slate-50/50">
                                    <span className="text-slate-500 font-medium flex gap-2 items-center"><Hash size={14}/> RFC / Tax ID</span>
                                    <span className="font-mono font-bold text-slate-800">{extra_data.tax_id || 'N/A'}</span>
                                </div>
                            </div>
                         </div>
                    )}

                    {/* 3. Domicilio Fiscal (DIRECCIÓN COMPLETA) */}
                    {extra_data?.address && (
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={14}/> Domicilio Registrado</h4>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-700 leading-relaxed">
                                {/* Asumimos que extra_data.address viene pre-formateado desde el backend o lo mostramos directo */}
                                {extra_data.address}
                            </div>
                        </div>
                    )}

                    {/* Zona de Acción */}
                    <div className="pt-6 border-t border-slate-200">
                        {isRegistrationRequest ? (
                            <AdminActions 
                                userId={extra_data.user_id}
                                userEmail={data.sender_email}
                                userName={data.sender_name}
                                onActionComplete={() => { onConfirmRead(); onClose(); }}
                            />
                        ) : (
                            <div className="flex gap-3">
                                 <button onClick={onConfirmRead} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-100"><CheckCircle2 size={18} className="inline mr-2"/> Marcar Leído</button>
                                 <button onClick={() => setIsReplyOpen(true)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg"><MessageCircle size={18} className="inline mr-2"/> Responder</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: DOCUMENTO (60%) */}
                <div className="lg:col-span-7 bg-slate-100 p-6 flex flex-col h-full relative">
                    <div className="flex items-center justify-between mb-4 z-10">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileText size={16} /> Evidencia Adjunta</h4>
                        {documentUrl && (
                            <a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                                <Download size={14} /> Descargar Original
                            </a>
                        )}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10">
                        {documentUrl ? (
                            isPdf ? <iframe src={documentUrl} className="w-full h-full" title="Doc"></iframe> : 
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 overflow-auto p-4"><img src={documentUrl} alt="Evidencia" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" /></div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300"><FileText size={64} className="mb-4 opacity-50" /><p>Sin documento</p></div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      <ReplyModal isOpen={isReplyOpen} onClose={() => setIsReplyOpen(false)} recipientName={data.sender_name} recipientEmail={data.sender_email} originalSubject={data.subject} />
    </>
  );
}