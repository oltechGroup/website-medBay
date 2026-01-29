// frontend/src/components/features/profile/ClientDocumentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, FileText, Download, ExternalLink, 
  ShieldCheck, CreditCard, Calendar, Clock, 
  CheckCircle2, XCircle, AlertTriangle, FileWarning 
} from "lucide-react";
import { Document as DocumentData } from "@/hooks/useDocuments";
import { OrderContext } from "@/components/features/documents/viewers/OrderContext";
import { formatDate } from "@/lib/formatters";

// --- HELPER ROBUSTO PARA URLS ---
const getFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  // 1. Definir URL Base (Fallback a tu IP si no hay env var)
  // NOTA: Asegúrate de que no tenga barra al final
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://54.159.31.18:4000/api';
  
  // 2. Limpiar '/api' si existe, para obtener la raíz (ej: http://54.159.31.18:4000)
  const serverRoot = apiUrl.replace(/\/api\/?$/, ''); 

  // 3. Asegurar que el path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${serverRoot}${cleanPath}`;
};

interface ClientDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData;
}

export const ClientDocumentModal = ({ isOpen, onClose, document: doc }: ClientDocumentModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false); // Estado para controlar errores de carga

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    // Resetear error al abrir/cambiar documento
    setHasError(false); 
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, doc]);

  if (!isOpen || !mounted) return null;

  const fileUrl = getFileUrl(doc.file_path);
  const isPdf = doc.file_path.toLowerCase().endsWith('.pdf');

  // Helper para el título
  const getDocTitle = () => {
    switch (doc.document_type) {
      case 'payment_evidence': return 'Evidencia de Pago';
      case 'license': return 'Registro Sanitario / Cédula';
      case 'business_registration': return 'Acta Constitutiva';
      default: return 'Documento';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[95vw] h-[90vh] bg-slate-50 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        
        {/* === COLUMNA IZQUIERDA: VISOR === */}
        <div className="flex-1 bg-slate-900 relative flex flex-col min-h-[50vh] lg:min-h-full">
          
          {/* Toolbar Flotante */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
            <span className="bg-black/50 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10">
              <FileText size={14}/> {isPdf ? 'PDF' : 'IMAGEN'}
            </span>
            <div className="flex gap-2 pointer-events-auto">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10" title="Abrir en pestaña nueva">
                <ExternalLink size={18}/>
              </a>
              <a href={fileUrl} download className="p-2.5 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10" title="Descargar">
                <Download size={18}/>
              </a>
            </div>
          </div>

          {/* Area de Visualización */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden bg-slate-800/50">
            
            {hasError ? (
              // 🔴 UI DE ERROR (FALLBACK)
              <div className="text-center p-8 bg-white rounded-2xl max-w-sm mx-auto">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileWarning size={32}/>
                </div>
                <h3 className="text-slate-800 font-bold mb-2">No se pudo previsualizar</h3>
                <p className="text-slate-500 text-xs mb-6">
                  El navegador bloqueó la vista previa por seguridad (Mixed Content) o el archivo no existe.
                </p>
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 w-full"
                >
                  <ExternalLink size={16}/> Abrir en nueva pestaña
                </a>
              </div>
            ) : (
              // 🟢 VISUALIZADOR NORMAL
              isPdf ? (
                // Los IFRAMES a veces no disparan onError en mixed content, por eso ponemos un aviso abajo si falla visualmente
                <div className="w-full h-full relative">
                   <iframe 
                     src={fileUrl} 
                     className="w-full h-full rounded-xl bg-white shadow-2xl relative z-10" 
                     title="Visor PDF"
                     onError={() => setHasError(true)} 
                   />
                   <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm z-0">
                      Cargando documento...
                   </div>
                </div>
              ) : (
                <img 
                  src={fileUrl} 
                  alt="Documento" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                  onError={() => setHasError(true)}
                />
              )
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: CONTEXTO (INFO CLIENTE) === */}
        <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 flex flex-col h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
            <div>
              <h2 className="text-xl font-black text-slate-800">{getDocTitle()}</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">ID: {doc.id.slice(0, 8)}...</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* LÓGICA CONDICIONAL DE CONTEXTO */}
            
            {/* CASO A: ES UN PAGO (Mostramos la Orden) */}
            {doc.document_type === 'payment_evidence' && doc.reference_id ? (
              <>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Comprobante de Pago</p>
                    <p className="text-xs text-emerald-600">Vinculado a tu orden de compra</p>
                  </div>
                </div>
                {/* Reutilizamos tu componente existente */}
                <OrderContext orderId={doc.reference_id} />
              </>
            ) : (
              /* CASO B: ES UN REGISTRO LEGAL (Mostramos Info de Cuenta) */
              <div className="space-y-6">
                
                {/* Estado del Documento */}
                <div className={`p-5 rounded-2xl border ${
                  doc.status === 'verified' ? 'bg-green-50 border-green-200' :
                  doc.status === 'rejected' ? 'bg-red-50 border-red-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {doc.status === 'verified' ? <CheckCircle2 className="text-green-600"/> :
                     doc.status === 'rejected' ? <XCircle className="text-red-600"/> :
                     <Clock className="text-amber-600"/>}
                    <h3 className={`font-bold uppercase tracking-wide text-sm ${
                      doc.status === 'verified' ? 'text-green-700' :
                      doc.status === 'rejected' ? 'text-red-700' :
                      'text-amber-700'
                    }`}>
                      Estado: {
                        doc.status === 'verified' ? 'Aprobado' : 
                        doc.status === 'rejected' ? 'Rechazado' : 'En Revisión'
                      }
                    </h3>
                  </div>
                  
                  {/* Mensaje explicativo según estado */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {doc.status === 'verified' 
                      ? "Este documento ha sido validado por nuestro equipo de cumplimiento. Tu cuenta tiene los permisos correspondientes activos."
                      : doc.status === 'rejected'
                      ? "Hubo un problema con este documento. Por favor revisa las notas y sube una nueva versión en tu perfil."
                      : "Estamos verificando la autenticidad de este documento. Te notificaremos en cuanto sea validado."
                    }
                  </p>

                  {/* Notas de rechazo (si existen) */}
                  {doc.notes && doc.status === 'rejected' && (
                    <div className="mt-4 pt-4 border-t border-red-200/50">
                      <p className="text-xs font-bold text-red-800 uppercase mb-1 flex items-center gap-1">
                        <AlertTriangle size={12}/> Motivo del rechazo:
                      </p>
                      <p className="text-sm text-red-700 italic">"{doc.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Detalles del Registro */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14}/> Detalles del Registro
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tipo de Cuenta</p>
                      <p className="text-sm font-bold text-slate-700">
                        {/* Como no tenemos el user aquí, inferimos por el tipo de doc o mostramos genérico */}
                        {doc.document_type === 'license' ? 'Profesional / Comercial' : 'Verificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Fecha de Carga</p>
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-700">
                        <Calendar size={14} className="text-slate-400"/>
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};