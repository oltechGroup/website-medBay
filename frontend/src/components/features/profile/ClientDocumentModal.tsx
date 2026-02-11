//frontend/src/components/features/profile/ClientDocumentModal.tsx
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
import { formatDate, getImageUrl } from "@/lib/formatters";

interface ClientDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData;
}

export const ClientDocumentModal = ({ isOpen, onClose, document: doc }: ClientDocumentModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reiniciar estados al cambiar de documento para una carga limpia
      setHasError(false);
      setIsLoading(true);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, doc]);

  if (!isOpen || !mounted) return null;

  // ✅ Usamos la función global que ya tiene el dominio HTTPS correcto
  const fileUrl = getImageUrl(doc.file_path);
  const isPdf = doc.file_path.toLowerCase().endsWith('.pdf');

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
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
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

          {/* Area de Visualización con manejo de carga y error */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden bg-slate-800/50 relative">
            
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Cargando archivo...</p>
                </div>
              </div>
            )}

            {hasError ? (
              <div className="text-center p-8 bg-white rounded-3xl max-w-sm mx-auto shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileWarning size={32}/>
                </div>
                <h3 className="text-slate-800 font-bold mb-2">Vista previa no disponible</h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                  Por razones de seguridad del navegador, no podemos mostrar este archivo directamente aquí. 
                  Puedes visualizarlo en una pestaña segura o descargarlo.
                </p>
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 w-full shadow-lg shadow-blue-200"
                >
                  <ExternalLink size={16}/> Abrir en ventana segura
                </a>
              </div>
            ) : (
              isPdf ? (
                <iframe 
                  src={`${fileUrl}#view=FitH`} 
                  className="w-full h-full rounded-xl bg-white shadow-2xl z-0" 
                  title="Visor de Documentos"
                  onLoad={() => setIsLoading(false)}
                  onError={() => { setHasError(true); setIsLoading(false); }} 
                />
              ) : (
                <img 
                  src={fileUrl} 
                  alt="Vista previa del documento" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl z-0" 
                  onLoad={() => setIsLoading(false)}
                  onError={() => { setHasError(true); setIsLoading(false); }}
                />
              )
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: CONTEXTO === */}
        <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          
          {/* Header del Modal */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
            <div>
              <h2 className="text-xl font-black text-slate-800">{getDocTitle()}</h2>
              <p className="text-xs text-slate-400 font-mono mt-1 italic">ID: {doc.id.slice(0, 12)}...</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {doc.document_type === 'payment_evidence' && doc.reference_id ? (
              <>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Pago Registrado</p>
                    <p className="text-xs text-emerald-600">Comprobante vinculado a tu compra</p>
                  </div>
                </div>
                <OrderContext orderId={doc.reference_id} />
              </>
            ) : (
              <div className="space-y-6">
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
                      {doc.status === 'verified' ? 'Validado con éxito' : 
                       doc.status === 'rejected' ? 'Acción Requerida' : 'En proceso de revisión'}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {doc.status === 'verified' 
                      ? "Este documento ha sido aprobado. Tu cuenta cuenta con las credenciales necesarias para operar en MedBay."
                      : doc.status === 'rejected'
                      ? "Se han encontrado inconsistencias. Por favor, revisa el motivo a continuación y carga una nueva versión."
                      : "Nuestro equipo está validando tu información. Recibirás una notificación en cuanto el proceso termine."
                    }
                  </p>

                  {doc.notes && doc.status === 'rejected' && (
                    <div className="mt-4 pt-4 border-t border-red-200/50">
                      <p className="text-xs font-bold text-red-800 uppercase mb-1 flex items-center gap-1">
                        <AlertTriangle size={12}/> Motivo reportado:
                      </p>
                      <p className="text-sm text-red-700 italic font-medium">"{doc.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14}/> Metadata del Archivo
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tipo</p>
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {doc.document_type === 'license' ? 'Certificación Médica' : 'Acta de Registro'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Cargado el</p>
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