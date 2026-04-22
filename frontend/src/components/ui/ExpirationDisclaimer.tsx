//frontend/src/components/ui/ExpirationDisclaimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

  // Si isVisible es falso, el componente no renderiza nada (no estorba en el DOM)
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* --- HEADER --- */}
        <div className="bg-amber-400 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Expiration Date Notice</h3>
          <button 
            onClick={handleClose}
            className="text-slate-800 hover:text-slate-950 transition-colors bg-amber-500/20 hover:bg-amber-500/40 p-1 rounded-full"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="p-6 space-y-6">
          <p className="text-slate-700 leading-relaxed text-sm font-medium">
            Please note that this item may be expired. If it is expired, this item is not for patient use and may only be purchased for research, veterinary, or educational purposes in accordance with Federal, State and local laws and regulations.
          </p>

          <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-all shadow-sm"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors select-none">
              Do not show me this warning again
            </span>
          </label>
        </div>

        {/* --- FOOTER --- */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <Button 
            onClick={handleClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold transition-all shadow-md shadow-blue-500/20"
          >
            Close
          </Button>
        </div>
        
      </div>
    </div>
  );
}