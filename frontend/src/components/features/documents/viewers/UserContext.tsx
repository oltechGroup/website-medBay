//frontend/src/components/features/documents/viewers/UserContext.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, User, Building, MapPin, Phone } from "lucide-react";

export const UserContext = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/users/${userId}`)
      .then(res => setUser(res.data))
      .catch(err => console.error("Error user", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!user) return <div className="p-4 text-slate-400">Usuario no encontrado.</div>;

  // Buscamos la dirección fiscal en el array de direcciones
  const fiscalAddress = user.addresses?.find((a: any) => a.is_fiscal) || user.addresses?.[0];

  return (
    <div className="space-y-6">
      
      {/* Datos Personales */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <User size={64} />
        </div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Solicitante</h4>
        <div className="space-y-1">
          <p className="text-lg font-black text-slate-900">{user.full_name}</p>
          <p className="text-sm text-blue-600 font-medium">{user.email}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Phone size={14}/> {user.phone || 'Sin teléfono'}
          </div>
        </div>
      </div>

      {/* Datos Fiscales */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
          <Building size={16} className="text-blue-500"/> Datos Fiscales
        </h4>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Razón Social</p>
              <p className="text-sm font-bold text-slate-800">{user.company_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">RFC / Tax ID</p>
              <p className="text-sm font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded w-fit">
                {user.tax_id || 'N/A'}
              </p>
            </div>
          </div>
          <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nivel Solicitado</p>
             <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase">
               {user.verification_level}
             </span>
          </div>
        </div>
      </div>

      {/* Dirección */}
      {fiscalAddress && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
            <MapPin size={16} className="text-blue-500"/> Dirección Fiscal
          </h4>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-sm text-slate-600 leading-relaxed shadow-sm">
            <p>{fiscalAddress.street} #{fiscalAddress.street_number}</p>
            <p>Col. {fiscalAddress.colony}</p>
            <p>{fiscalAddress.city}, {fiscalAddress.state}, {fiscalAddress.country}</p>
            <p className="font-bold text-slate-800 mt-1">CP: {fiscalAddress.postal_code}</p>
          </div>
        </div>
      )}
    </div>
  );
};