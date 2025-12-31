// frontend/src/components/features/contact/details/RegisterDetails.tsx

import React from 'react';
import { Building2, MapPin, Hash, UserCheck, Shield } from 'lucide-react';

interface RegisterDetailsProps {
  details: any; // Datos que vienen en extra_data (user_id, role_name, company, address, etc.)
}

export default function RegisterDetails({ details }: RegisterDetailsProps) {
  if (!details) return null;

  return (
    <div className="space-y-6">
      
      {/* 1. Perfil Solicitado */}
      <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
          <UserCheck size={14} /> Perfil Solicitado
        </h4>
        
        <div className="flex items-center gap-3">
           <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
              <Shield size={24} />
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                {details.role_name}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1">Requiere validación manual</p>
           </div>
        </div>
      </div>

      {/* 2. Datos Fiscales */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Building2 size={14} /> Información Fiscal
        </h4>
        
        <div className="space-y-3 text-sm">
           <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Empresa / Razón Social:</span>
              <span className="font-bold text-slate-800">{details.company || 'N/A'}</span>
           </div>
           <div className="flex justify-between pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1"><Hash size={12}/> RFC:</span>
              <span className="font-mono font-bold text-slate-800">{details.tax_id || 'N/A'}</span>
           </div>
        </div>
      </div>

      {/* 3. Dirección Fiscal */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <MapPin size={14} /> Domicilio Registrado
        </h4>
        
        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium bg-white p-4 rounded-xl border border-slate-200">
          {details.address}
        </div>
      </div>

    </div>
  );
}