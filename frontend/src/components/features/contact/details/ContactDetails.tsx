// frontend/src/components/features/contact/details/ContactDetails.tsx

import React from 'react';
import { MessageSquare, AlignLeft } from 'lucide-react';

interface ContactDetailsProps {
  details: any; // Datos extra si los hubiera
  message: string;
}

export default function ContactDetails({ details, message }: ContactDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Caja del Mensaje */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare size={14} /> Mensaje Recibido
        </h4>
        
        <div className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap font-medium">
          {message}
        </div>
      </div>

      {/* Datos adicionales si existieran en contact_details */}
      {details && Object.keys(details).length > 0 && (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlignLeft size={14} /> Datos Adicionales
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {Object.entries(details).map(([key, value]) => {
                if (key === 'mensaje' || key === 'nombre' || key === 'email' || key === 'asunto') return null;
                return (
                    <div key={key} className="flex justify-between border-b border-slate-200 pb-2 last:border-0">
                        <span className="font-bold text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-800">{String(value)}</span>
                    </div>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
}