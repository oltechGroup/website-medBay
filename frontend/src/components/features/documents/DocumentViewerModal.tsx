// frontend/src/components/features/documents/DocumentViewerModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, XCircle, FileText, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Document as DocumentData, DocStatus } from "@/hooks/useDocuments";
import { getImageUrl } from "@/lib/formatters";
import { OrderContext } from "./viewers/OrderContext";
import { UserContext } from "./viewers/UserContext";

// Importamos AdminActions para aprobar usuarios
import AdminActions from "../admin/AdminActions";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData; 
  onStatusChange: (id: string, status: DocStatus, notes?: string) => Promise<void>;
  isUpdating: boolean;
}

export const DocumentViewerModal = ({ 
  isOpen, 
  onClose, 
  document: doc, 
  onStatusChange,
  isUpdating 
}: DocumentViewerModalProps) => {
  const [mounted, setMounted] = useState(false);
  
  // Estados para acción manual (Solo documentos simples)
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isPdf = doc.file_path.toLowerCase().endsWith('.pdf');
  const fileUrl = getImageUrl(doc.file_path);

  // Contexto a mostrar
  const renderContext = () => {
    if (doc.document_type === 'payment_evidence' && doc.reference_id) {
      return <OrderContext orderId={doc.reference_id} />;
    }
    return <UserContext userId={doc.owner_id} />;
  };

  // Título Personalizado
  const getDocTitle = () => {
    switch (doc.document_type) {
      case 'payment_evidence': return 'Evidencia de Pago';
      case 'license': return 'Evidencia de Registro'; // ✅ CAMBIADO
      case 'business_registration': return 'Registro de Negocio';
      default: return 'Documento';
    }
  };

  // Acción simple (Pagos/Otros)
  const handleSimpleAction = async (status: DocStatus) => {
    if (status === 'rejected' && !rejectReason) {
      setShowRejectInput(true);
      return;
    }
    await onStatusChange(doc.id, status, rejectReason);
    if (status === 'verified') onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[95vw] h-[90vh] bg-slate-50 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        
        {/* === COLUMNA IZQUIERDA: VISOR === */}
        <div className="flex-1 bg-slate-900 relative flex flex-col min-h-[50vh] lg:min-h-full">
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
            <span className="bg-black/50 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10">
              <FileText size={14}/> {isPdf ? 'Archivo PDF' : 'Imagen'}
            </span>
            <div className="flex gap-2 pointer-events-auto">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10"><ExternalLink size={18}/></a>
              <a href={fileUrl} download className="p-2.5 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10"><Download size={18}/></a>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            {isPdf ? (
              <iframe src={fileUrl} className="w-full h-full rounded-xl bg-white shadow-2xl" title="Visor PDF" />
            ) : (
              <img src={fileUrl} alt="Documento" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: CONTEXTO Y ACCIONES === */}
        <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 flex flex-col h-full">
          
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
            <div>
              <h2 className="text-xl font-black text-slate-800">{getDocTitle()}</h2>
              <p className="text-xs text-slate-400 font-mono mt-1 break-all">{doc.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {renderContext()}
            {doc.notes && (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Notas Previas</p>
                <p className="text-sm text-yellow-800 italic">"{doc.notes}"</p>
              </div>
            )}
          </div>

          {/* === FOOTER INTELIGENTE === */}
          {/* Solo mostramos footer si NO es pago (los pagos se validan en ordenes) */}
          {doc.document_type !== 'payment_evidence' && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              
              {/* CASO 1: USUARIO YA ACTIVO (Aprobado) */}
              {doc.user_status === 'active' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-green-700 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={20}/> Cuenta Aprobada
                  </p>
                  <p className="text-xs text-green-600 mt-1">El usuario ya tiene acceso al sistema.</p>
                </div>
              ) : doc.user_status === 'rejected' ? (
                /* CASO 2: USUARIO RECHAZADO */
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-red-700 font-bold flex items-center justify-center gap-2">
                    <XCircle size={20}/> Solicitud Rechazada
                  </p>
                  <p className="text-xs text-red-600 mt-1">El usuario fue notificado.</p>
                </div>
              ) : (
                /* CASO 3: PENDIENTE (Mostramos acciones) */
                doc.document_type === 'license' ? (
                  <div className="animate-in slide-in-from-bottom-2">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">Gestión de Cuenta</p>
                    <AdminActions 
                      userId={doc.owner_id}
                      userEmail={doc.user_email || ''}
                      userName={doc.user_name || 'Usuario'}
                      onActionComplete={onClose}
                    />
                  </div>
                ) : (
                  /* CASO 4: DOCUMENTO SIMPLE (No es registro ni pago) */
                  <>
                    {showRejectInput ? (
                      <div className="space-y-3 animate-in slide-in-from-bottom-2">
                        <label className="text-xs font-bold text-slate-700 ml-1">Motivo del rechazo:</label>
                        <textarea 
                          className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:border-red-500 focus:ring-red-500 outline-none"
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          autoFocus
                        ></textarea>
                        <div className="flex gap-2">
                          <button onClick={() => setShowRejectInput(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl">Cancelar</button>
                          <button 
                            onClick={() => handleSimpleAction('rejected')}
                            disabled={isUpdating || !rejectReason.trim()}
                            className="flex-1 py-3 bg-red-600 text-white font-bold text-sm hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50 flex justify-center"
                          >
                            {isUpdating ? <Loader2 className="animate-spin"/> : 'Confirmar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setShowRejectInput(true)}
                          disabled={isUpdating}
                          className="flex-1 py-4 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={20}/> Rechazar
                        </button>
                        <button 
                          onClick={() => handleSimpleAction('verified')}
                          disabled={isUpdating}
                          className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          {isUpdating ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={20}/>}
                          Validar
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};