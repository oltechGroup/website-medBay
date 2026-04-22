//frontend/src/components/ui/ExpirationDisclaimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/Button';

export function ExpirationDisclaimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Cuando el componente se monta en el cliente, leemos la memoria del navegador
    const hideDisclaimer = localStorage.getItem('medbay_hide_expiration_disclaimer');
    
    // Si no existe la marca de "ocultar", lo mostramos
    if (!hideDisclaimer) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    // Si el usuario marcó la casilla, guardamos su preferencia en localStorage
    if (dontShowAgain) {
      localStorage.setItem('medbay_hide_expiration_disclaimer', 'true');
    }
    
    // Cerramos el modal visualmente
    setIsVisible(false);
  };

  // Si isVisible es falso, el componente no renderiza nada
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border border-slate-100">
        
        {/* --- CLOSE BUTTON --- */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-200 p-3 rounded-full"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10 space-y-8">
          
          {/* --- HEADER --- */}
          <div className="flex flex-col items-center text-center mt-2">
            <div className="flex justify-center mb-6">
                <img src="/icons/logomed.png" alt="MedBay Logo" className="w-16 h-16" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-4">
              <AlertTriangle size={14} /> Compliance Notice
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Expiration Date Notice
            </h3>
          </div>

          {/* --- BODY --- */}
          <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-inner">
            <p className="text-slate-600 leading-relaxed text-sm font-medium text-center">
              Please note that this item may be expired. If it is expired, this item is <span className="font-bold text-slate-900">not for patient use</span> and may only be purchased for research, veterinary, or educational purposes in accordance with Federal, State and local laws and regulations.
            </p>
          </div>

          {/* --- CHECKBOX --- */}
          <div className="flex justify-center">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-all shadow-sm"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors select-none">
                Do not show me this warning again
              </span>
            </label>
          </div>

          {/* --- FOOTER --- */}
          <Button 
            onClick={handleClose}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white h-14 rounded-2xl text-lg font-bold shadow-xl shadow-slate-900/10 transition-all"
          >
            I Understand
          </Button>

        </div>
      </div>
    </div>
  );
}