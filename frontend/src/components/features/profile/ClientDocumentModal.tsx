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
      // Reset states when changing documents for a clean load
      setHasError(false);
      setIsLoading(true);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, doc]);

  if (!isOpen || !mounted) return null;

  // ✅ Using global function with correct HTTPS domain
  const fileUrl = getImageUrl(doc.file_path);
  const isPdf = doc.file_path.toLowerCase().endsWith('.pdf');

  const getDocTitle = () => {
    switch (doc.document_type) {
      case 'payment_evidence': return 'Payment Evidence';
      case 'license': return 'Sanitary Registry / Professional ID';
      case 'business_registration': return 'Articles of Incorporation';
      default: return 'Document';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[95vw] h-[90vh] bg-slate-50 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        
        {/* === LEFT COLUMN: VIEWER === */}
        <div className="flex-1 bg-slate-900 relative flex flex-col min-h-[50vh] lg:min-h-full">
          
          {/* Floating Toolbar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
            <span className="bg-black/50 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10">
              <FileText size={14}/> {isPdf ? 'PDF' : 'IMAGE'}
            </span>
            <div className="flex gap-2 pointer-events-auto">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10" title="Open in new tab">
                <ExternalLink size={18}/>
              </a>
              <a href={fileUrl} download className="p-2.5 bg-black/50 text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10" title="Download">
                <Download size={18}/>
              </a>
            </div>
          </div>

          {/* Visualization Area with loading and error handling */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden bg-slate-800/50 relative">
            
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Loading file...</p>
                </div>
              </div>
            )}

            {hasError ? (
              <div className="text-center p-8 bg-white rounded-3xl max-w-sm mx-auto shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileWarning size={32}/>
                </div>
                <h3 className="text-slate-800 font-bold mb-2">Preview not available</h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                  For browser security reasons, we cannot display this file directly here. 
                  You can view it in a secure tab or download it.
                </p>
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 w-full shadow-lg shadow-blue-200"
                >
                  <ExternalLink size={16}/> Open in secure window
                </a>
              </div>
            ) : (
              isPdf ? (
                <iframe 
                  src={`${fileUrl}#view=FitH`} 
                  className="w-full h-full rounded-xl bg-white shadow-2xl z-0" 
                  title="Document Viewer"
                  onLoad={() => setIsLoading(false)}
                  onError={() => { setHasError(true); setIsLoading(false); }} 
                />
              ) : (
                <img 
                  src={fileUrl} 
                  alt="Document preview" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl z-0" 
                  onLoad={() => setIsLoading(false)}
                  onError={() => { setHasError(true); setIsLoading(false); }}
                />
              )
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: CONTEXT === */}
        <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          
          {/* Modal Header */}
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
                    <p className="text-sm font-bold text-emerald-800">Payment Registered</p>
                    <p className="text-xs text-emerald-600">Receipt linked to your purchase</p>
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
                      {doc.status === 'verified' ? 'Successfully Validated' : 
                       doc.status === 'rejected' ? 'Action Required' : 'Under Review Process'}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {doc.status === 'verified' 
                      ? "This document has been approved. Your account has the necessary credentials to operate on MedBay."
                      : doc.status === 'rejected'
                      ? "Inconsistencies have been found. Please review the reason below and upload a new version."
                      : "Our team is validating your information. You will receive a notification as soon as the process is complete."
                    }
                  </p>

                  {doc.notes && doc.status === 'rejected' && (
                    <div className="mt-4 pt-4 border-t border-red-200/50">
                      <p className="text-xs font-bold text-red-800 uppercase mb-1 flex items-center gap-1">
                        <AlertTriangle size={12}/> Reported reason:
                      </p>
                      <p className="text-sm text-red-700 italic font-medium">"{doc.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14}/> File Metadata
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Type</p>
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {doc.document_type === 'license' ? 'Medical Certification' : 'Registration Certificate'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Uploaded on</p>
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