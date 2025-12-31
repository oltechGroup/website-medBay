import React, { useState } from 'react';
import { X, Mail, User, CheckCircle2, MessageCircle, FileText, Download, Clock, Phone, Maximize2 } from 'lucide-react';
import ReplyModal from './ReplyModal'; 
import AdminActions from '../admin/AdminActions'; 

// Importamos los componentes de detalle
import QuoteDetails from './details/QuoteDetails';
import ContactDetails from './details/ContactDetails';
import RegisterDetails from './details/RegisterDetails'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRead: () => void;
  data: any; 
}

export default function NotificationModal({ isOpen, onClose, onConfirmRead, data }: ModalProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  if (!isOpen || !data) return null;

  // Parseamos el JSONB
  const content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
  
  // Extraemos datos comunes
  const { mensaje, product_details, contact_details, extra_data } = content;
  
  // Detectamos tipo
  const isQuote = data.type === 'Solicitud de Cotización';
  const isContact = data.type === 'Contacto General';
  const isRegistrationRequest = data.type === 'Registro Usuario';

  // Lógica de Archivos
  const documentUrl = extra_data?.file_path ? `http://localhost:3001${extra_data.file_path}` : null;
  const isPdf = documentUrl?.toLowerCase().endsWith('.pdf');

  // Lógica de Teléfono
  const phoneNumber = extra_data?.phone || contact_details?.phone || null;

  // Lógica de Diseño: ¿Necesitamos columna lateral?
  const hasSideColumn = isRegistrationRequest || !!documentUrl;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white w-full max-w-7xl h-full max-h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          
          {/* === HEADER === */}
          <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
               <div className={`p-2 rounded-xl border border-slate-100 
                 ${isQuote ? 'bg-blue-50 text-blue-600' : isRegistrationRequest ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}
               `}>
                 {isQuote ? <FileText size={24}/> : isRegistrationRequest ? <User size={24}/> : <MessageCircle size={24}/>}
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

          {/* === BODY === */}
          <div className="flex-1 overflow-hidden bg-slate-50/50">
            <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                
                {/* COLUMNA PRINCIPAL (Info) */}
                {/* Ajusté lg:col-span-6 para dar más espacio al texto cuando hay archivo */}
                <div className={`${hasSideColumn ? 'lg:col-span-6 border-r border-slate-200' : 'lg:col-span-12 max-w-5xl mx-auto w-full'} overflow-y-auto custom-scrollbar p-8 text-sm flex flex-col gap-6`}>
                    
                    {/* 1. TARJETA DE REMITENTE */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                                    {data.sender_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Remitente</p>
                                    <h4 className="text-lg font-bold text-slate-800">{data.sender_name}</h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Recibido</p>
                                <p className="text-slate-600 font-medium flex items-center justify-end gap-1">
                                    <Clock size={14}/> {new Date(data.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                               <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500 flex-shrink-0"><Mail size={16}/></div>
                               <div className="min-w-0 flex-1"> {/* Permite que el hijo se encoja si es necesario */}
                                   <p className="text-[10px] font-bold text-slate-400 uppercase">Correo</p>
                                   {/* ✅ CORRECCIÓN: break-all permite que correos largos bajen de línea */}
                                   <p className="text-slate-700 font-medium break-all leading-tight">{data.sender_email}</p>
                               </div>
                           </div>
                           
                           {phoneNumber && (
                               <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                                   <div className="p-2 bg-white rounded-lg shadow-sm text-green-500 flex-shrink-0"><Phone size={16}/></div>
                                   <div>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</p>
                                       <p className="text-slate-700 font-medium">{phoneNumber}</p>
                                   </div>
                               </div>
                           )}
                        </div>
                    </div>

                    {/* 2. CONTENIDO ESPECÍFICO */}
                    {isQuote && product_details ? (
                        <QuoteDetails details={product_details} message={mensaje} />
                    ) : isContact ? (
                        <ContactDetails details={contact_details} message={mensaje} />
                    ) : isRegistrationRequest ? (
                        <RegisterDetails details={extra_data} />
                    ) : null}

                    {/* 3. ZONA DE ACCIÓN */}
                    <div className="mt-auto pt-6 border-t border-slate-200">
                        {isRegistrationRequest ? (
                            <AdminActions 
                                userId={extra_data?.user_id}
                                userEmail={data.sender_email}
                                userName={data.sender_name}
                                onActionComplete={() => { onConfirmRead(); onClose(); }}
                            />
                        ) : (
                            <div className="flex gap-4">
                                 <button onClick={onConfirmRead} className="flex-1 py-4 border-2 border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center gap-2">
                                   <CheckCircle2 size={20} /> Marcar Leído
                                 </button>
                                 <button onClick={() => setIsReplyOpen(true)} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 shadow-xl shadow-slate-200 transition-colors flex items-center justify-center gap-2">
                                   <MessageCircle size={20} /> Responder Mensaje
                                 </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA LATERAL (SOLO SI ES NECESARIA) */}
                {hasSideColumn && (
                    <div className="lg:col-span-6 bg-slate-100 p-6 flex flex-col h-full relative border-l border-white">
                        <div className="flex items-center justify-between mb-4 z-10">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <FileText size={16} /> Evidencia Documental
                            </h4>
                            {documentUrl && (
                                <div className="flex gap-2">
                                    <a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 transition-colors flex items-center gap-1 bg-white px-4 py-2 rounded-lg shadow-sm">
                                        <Download size={14} /> Descargar
                                    </a>
                                    <a href={documentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-600 hover:text-white hover:bg-slate-600 transition-colors flex items-center gap-1 bg-white px-4 py-2 rounded-lg shadow-sm">
                                        <Maximize2 size={14} /> Expandir
                                    </a>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative z-10 group">
                            {documentUrl ? (
                                isPdf ? <iframe src={documentUrl} className="w-full h-full" title="Doc"></iframe> : 
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 overflow-auto p-8">
                                    <img src={documentUrl} alt="Evidencia" className="max-w-full max-h-full object-contain rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                   <FileText size={64} className="mb-4 opacity-30" />
                                   <p className="font-medium">Sin vista previa disponible</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {/* MODAL DE RESPUESTA */}
      <ReplyModal 
        isOpen={isReplyOpen} 
        onClose={() => setIsReplyOpen(false)} 
        recipientName={data.sender_name} 
        recipientEmail={data.sender_email} 
        originalSubject={data.subject} 
        quoteDetails={isQuote && product_details ? {
            name: product_details.name,
            sku: product_details.sku,
            quantity: product_details.quantity
        } : undefined}
      />
    </>
  );
}