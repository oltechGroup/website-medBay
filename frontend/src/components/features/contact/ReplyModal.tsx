//frontend/src/components/features/contact/ReplyModal.tsx
import React, { useState } from 'react';
import { X, Send, Loader2, CornerUpLeft, Package } from 'lucide-react';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  originalSubject: string;
  quoteDetails?: {
    name: string;
    sku: string;
    quantity: number;
  };
}

export default function ReplyModal({ 
  isOpen, 
  onClose, 
  recipientName, 
  recipientEmail, 
  originalSubject,
  quoteDetails 
}: ReplyModalProps) {
  
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('https://api.medbaysupply.com/api/contact/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: recipientEmail,
          originalSubject: originalSubject,
          message: message,
          recipientName: recipientName, 
          quoteDetails: quoteDetails 
        }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
          onClose(); 
        }, 2000);
      } else {
        throw new Error('Send error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <CornerUpLeft size={20} />
            <h3 className="font-bold text-slate-800">Compose Reply</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSendReply} className="p-6 space-y-4">
          
          {/* Recipient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase">To:</span>
              <span className="font-semibold text-slate-700">{recipientName}</span>
              <span className="block text-xs text-slate-500">{recipientEmail}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase">Subject:</span>
              <span className="font-semibold text-slate-700 truncate">RE: {originalSubject}</span>
            </div>
          </div>

          {/* Quote Context */}
          {quoteDetails && (
             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-3 text-sm">
                <Package className="text-blue-600" size={18} />
                <div>
                   <p className="font-bold text-blue-800 text-xs uppercase">Replying regarding:</p>
                   <p className="text-slate-700 font-medium">{quoteDetails.name} (x{quoteDetails.quantity})</p>
                </div>
             </div>
          )}

          {/* Text Area */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase ml-1">Your Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the official response (price, availability, delivery times)..."
              className="w-full mt-1 bg-white border border-slate-200 rounded-xl p-4 text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none h-40 font-medium"
              required
              disabled={status === 'sending' || status === 'success'}
            ></textarea>
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold text-center border border-green-200">
              Reply sent successfully!
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-bold text-center border border-red-200">
              Error sending. Check the console.
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={status === 'sending'}
              className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={status === 'sending' || status === 'success'}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reply
                  <Send size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}