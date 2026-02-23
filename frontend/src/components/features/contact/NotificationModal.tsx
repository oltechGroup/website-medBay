// frontend/src/components/features/contact/NotificationModal.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Mail, User, MessageCircle, ShoppingCart, MessageSquareQuote, 
  ExternalLink, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import ReplyModal from './ReplyModal'; 

// Import existing details
import ContactDetails from './details/ContactDetails';
import RegisterDetails from './details/RegisterDetails'; 

// Flexible interface based on InboxItem
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRead: () => void;
  data: any; 
}

export default function NotificationModal({ isOpen, onClose, onConfirmRead, data }: ModalProps) {
  const router = useRouter();
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  if (!isOpen || !data) return null;

  // --- 1. DETERMINE TYPE AND SOURCE ---
  const source = data.source || 'notification'; // 'order' | 'quote' | 'notification'
  const type = data.type; // 'Nueva Orden', 'Solicitud de Cotización', 'Registro Usuario', etc.

  // --- 2. PREPARE DATA ACCORDING TO SOURCE ---
  let content: any = {};
  
  if (source === 'notification') {
    // If it comes from notifications table, content is a JSON string or object
    content = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
  } else {
    // If it is order or quote, data is already structured
    content = data.data;
  }

  // --- 3. REDIRECTION LOGIC (Centralized Management) ---
  const handleManageRedirect = () => {
    if (source === 'order') {
      router.push('/dashboard/orders');
    } else if (source === 'quote') {
      router.push('/dashboard/quotes');
    } else if (type === 'Registro Usuario') {
      // Redirect to users table for centralized validation
      router.push('/dashboard/users');
    }
    onClose();
  };

  // --- 4. RENDER SPECIFIC CONTENT ---
  const renderSpecificContent = () => {
    
    // A) ORDER VIEW
    if (source === 'order') {
      return (
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Purchase Request</h3>
              <p className="text-emerald-700 font-medium text-sm">{data.subject}</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Amount</span>
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(content.total)} <span className="text-sm text-slate-400">{content.currency}</span>
            </span>
          </div>

          <div className="flex gap-2 text-xs text-slate-500 bg-white/50 p-3 rounded-lg">
            <AlertCircle size={14} className="text-emerald-600"/>
            This order requires stock review or payment validation.
          </div>
        </div>
      );
    }

    // B) QUOTE VIEW
    if (source === 'quote') {
      return (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm text-amber-600">
              <MessageSquareQuote size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Quote Requested</h3>
              <p className="text-amber-700 font-medium text-sm">{content.product_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">SKU</p>
              <p className="font-mono font-bold text-slate-700">{content.sku || 'N/A'}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
              <p className="font-bold text-slate-700">{content.quantity_asked} pcs</p>
            </div>
          </div>

          {content.notes && (
            <div className="text-sm text-slate-600 italic bg-white p-4 rounded-xl border border-slate-100">
              "{content.notes}"
            </div>
          )}
        </div>
      );
    }

    // C) USER REGISTRATION (Visualization Only)
    if (type === 'Registro Usuario') {
      return <RegisterDetails details={content.extra_data} />;
    }

    // D) GENERAL CONTACT
    return <ContactDetails details={content.contact_details} message={content.mensaje} />;
  };

  // --- 5. HEADER VISUAL CONFIGURATION ---
  const getHeaderStyles = () => {
    if (source === 'order') return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <ShoppingCart size={24}/> };
    if (source === 'quote') return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <MessageSquareQuote size={24}/> };
    if (type === 'Registro Usuario') return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <User size={24}/> };
    return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <MessageCircle size={24}/> };
  };

  const headerStyle = getHeaderStyles();

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white w-full max-w-4xl h-auto max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          
          {/* HEADER */}
          <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
               <div className={`p-2 rounded-xl border border-slate-100 ${headerStyle.bg} ${headerStyle.text}`}>
                 {headerStyle.icon}
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 line-clamp-1">{data.subject}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse bg-current ${headerStyle.text}`}></span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{type}</p>
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-8">
             <div className="flex flex-col gap-6">
                
                {/* 1. Sender Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                            {data.sender_name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">From</p>
                            <h4 className="text-lg font-bold text-slate-800">{data.sender_name}</h4>
                            <p className="text-sm text-slate-500">{data.sender_email}</p>
                         </div>
                      </div>
                      <div className="text-right text-xs text-slate-400 font-medium">
                         <div className="flex items-center justify-end gap-1 mb-1">
                           <Clock size={14}/> {new Date(data.created_at).toLocaleDateString()}
                         </div>
                         {new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </div>

                {/* 2. Dynamic Content */}
                {renderSpecificContent()}

             </div>
          </div>

          {/* FOOTER (ACTIONS) */}
          <div className="p-6 border-t border-slate-200 bg-white z-20">
              
              {/* CASE 1: MANAGEMENT (Order / Quote / Registration) */}
              {(source === 'order' || source === 'quote' || type === 'Registro Usuario') && (
                <button 
                  onClick={handleManageRedirect}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
                >
                  {type === 'Registro Usuario' ? 'Go to User Management' : 'Manage Request'} 
                  <ExternalLink size={20} />
                </button>
              )}

              {/* CASE 2: NORMAL MESSAGE (Reply/Read) */}
              {source === 'notification' && type !== 'Registro Usuario' && (
                <div className="flex gap-4">
                   <button onClick={onConfirmRead} className="flex-1 py-4 border-2 border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center gap-2">
                     <CheckCircle2 size={20} /> Mark as Read
                   </button>
                   <button onClick={() => setIsReplyOpen(true)} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 shadow-xl shadow-slate-200 transition-colors flex items-center justify-center gap-2">
                     <MessageCircle size={20} /> Reply
                   </button>
                </div>
              )}

          </div>
        </div>
      </div>
      
      {/* SIMPLE REPLY MODAL */}
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