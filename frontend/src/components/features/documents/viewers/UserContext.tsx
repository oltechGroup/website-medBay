// frontend/src/components/features/documents/viewers/UserContext.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, User, Building, MapPin, Phone, Info } from "lucide-react";

export const UserContext = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/users/${userId}`)
      .then(res => setUser(res.data))
      .catch(err => console.error("User error", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!user) return <div className="p-4 text-slate-400">User not found.</div>;

  // Search for the fiscal address
  const fiscalAddress = user.addresses?.find((a: any) => a.is_fiscal) || user.addresses?.[0];

  // Helper for role UI labels
  const getRoleUI = (role: string) => {
    switch (role) {
      case 'business_verified': 
        return { label: 'Business', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'medical_professional': 
        return { label: 'Professional', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'sales_agent':
        return { label: 'Sales Agent', className: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'admin':
        return { label: 'Administrator', className: 'bg-slate-800 text-white border-slate-900' };
      default: 
        return { label: 'Consumer', className: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const roleUI = getRoleUI(user.verification_level);

  return (
    <div className="space-y-6">
      
      {/* Personal Information */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <User size={64} />
        </div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Applicant</h4>
        <div className="space-y-1">
          <p className="text-lg font-black text-slate-900">{user.full_name}</p>
          <p className="text-sm text-blue-600 font-medium">{user.email}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Phone size={14}/> {user.phone || 'No phone number'}
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
          <Building size={16} className="text-blue-500"/> Tax Information
        </h4>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Legal Entity / Company</p>
              <p className="text-sm font-bold text-slate-800 break-words">{user.company_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tax ID / RFC</p>
              <p className="text-sm font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">
                {user.tax_id || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-50">
             <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Requested Level</p>
             <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase border ${roleUI.className}`}>
               {roleUI.label}
             </span>
          </div>
        </div>
      </div>

      {/* Full Address */}
      {fiscalAddress && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
            <MapPin size={16} className="text-blue-500"/> Full Tax Address
          </h4>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-sm text-slate-600 leading-relaxed shadow-sm space-y-3">
            
            {/* Street and Number */}
            <div>
              <p className="font-bold text-slate-900 text-base">
                {fiscalAddress.street} #{fiscalAddress.street_number}
                {fiscalAddress.suite_number && <span className="text-slate-500 font-normal ml-1">Suite {fiscalAddress.suite_number}</span>}
              </p>
              <p className="text-slate-500">Col. {fiscalAddress.colony}</p>
            </div>

            {/* City and State */}
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <span>{fiscalAddress.city}, {fiscalAddress.state}</span>
              <span>•</span>
              <span>Zip Code: {fiscalAddress.postal_code}</span>
            </div>

            {/* Country */}
            <div className="text-xs bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100 font-bold text-slate-500">
              {fiscalAddress.country}
            </div>

            {/* Extra References */}
            {(fiscalAddress.between_streets || fiscalAddress.reference_point) && (
              <div className="pt-3 border-t border-slate-50 mt-2">
                {fiscalAddress.between_streets && (
                  <div className="flex gap-2 mb-1">
                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5"/>
                    <p className="text-xs text-slate-500"><span className="font-bold">Cross streets:</span> {fiscalAddress.between_streets}</p>
                  </div>
                )}
                {fiscalAddress.reference_point && (
                  <div className="flex gap-2">
                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5"/>
                    <p className="text-xs text-slate-500"><span className="font-bold">Reference:</span> {fiscalAddress.reference_point}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};