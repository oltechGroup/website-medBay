// frontend/src/components/features/admin/EmailPreviewModal.tsx

import React from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Loader2, Mail } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  type: 'approve' | 'reject'; // Determines color (Green/Red)
  recipientName: string;
  recipientEmail: string;
  subject: string;
  messageBody: string; // Message content
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  type,
  recipientName,
  recipientEmail,
  subject,
  messageBody
}: EmailPreviewModalProps) {
  
  if (!isOpen) return null;

  const isApprove = type === 'approve';
  const themeColor = isApprove ? 'blue' : 'red';
  const buttonColor = isApprove ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      ></div>

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Visual Header */}
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${isApprove ? 'bg-blue-50/50' : 'bg-red-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isApprove ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
               {isApprove ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-lg">Confirm Send</h3>
               <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                 {isApprove ? 'Account Authorization' : 'Rejection and Deletion'}
               </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Email Preview */}
        <div className="p-6 bg-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Mail size={14} /> Email Preview
            </p>
            
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-sm">
               <div className="border-b border-slate-100 pb-3 mb-3 space-y-1">
                  <p><span className="text-slate-400 font-semibold">To:</span> <span className="text-slate-800">{recipientName}</span> &lt;{recipientEmail}&gt;</p>
                  <p><span className="text-slate-400 font-semibold">Subject:</span> <span className="text-slate-800 font-medium">{subject}</span></p>
               </div>
               
               {/* Simulated message body */}
               <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  <p className="mb-2">Hello <strong>{recipientName}</strong>,</p>
                  {messageBody}
                  <p className="mt-4 text-xs text-slate-400 italic">
                    * This email will be sent automatically with MedBay's corporate signature.
                  </p>
               </div>
            </div>

            {!isApprove && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-700 text-xs font-bold">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <p>Warning: Upon confirmation, the user's record and their files will be permanently deleted from the database.</p>
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel / Edit
            </button>
            
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-lg flex items-center gap-2 transition-all ${buttonColor} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={18} />
                  {isApprove ? 'Send and Authorize' : 'Send and Delete'}
                </>
              )}
            </button>
        </div>

      </div>
    </div>
  );
}