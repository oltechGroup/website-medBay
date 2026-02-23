// frontend/src/components/features/contact/details/QuoteDetails.tsx

import React from 'react';
import { Package, Hash, Factory, Calendar, AlertCircle, ShoppingBag } from 'lucide-react';

interface QuoteDetailsProps {
  details: any; // Comes from content.product_details
  message?: string;
}

export default function QuoteDetails({ details, message }: QuoteDetailsProps) {
  // Color mapping based on request type for quick visual identification
  const getTypeBadgeColor = (type: string) => {
    if (type?.includes('Expired')) return 'bg-red-100 text-red-700 border-red-200';
    if (type?.includes('Short Date')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="space-y-6">
      {/* 1. Product Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShoppingBag size={14} /> Requested Product
        </h4>
        
        <h3 className="text-xl font-black text-slate-800 leading-tight mb-2">
          {details.name}
        </h3>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600">
            <Hash size={12} /> SKU: {details.sku}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700 uppercase">
            <Factory size={12} /> {details.manufacturer}
          </span>
        </div>
      </div>

      {/* 2. Request Details (Grid) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Quantity */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1">
            <Package size={14} /> Quantity
          </p>
          <p className="text-2xl font-black text-slate-800">
            {details.quantity} <span className="text-sm font-medium text-slate-400">pcs</span>
          </p>
        </div>

        {/* Required Type */}
        <div className={`p-4 rounded-xl border ${getTypeBadgeColor(details.type)}`}>
          <p className="text-xs font-bold uppercase mb-1 flex items-center gap-1 opacity-80">
            <Calendar size={14} /> Required Type
          </p>
          <p className="text-sm font-black leading-tight">
            {details.type}
          </p>
        </div>
      </div>

      {/* 3. Customer Message / Notes */}
      {message && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> Customer Notes
          </h4>
          <div className="text-slate-600 text-sm italic leading-relaxed bg-slate-50 p-4 rounded-xl border-l-4 border-blue-400">
            "{message}"
          </div>
        </div>
      )}
    </div>
  );
}