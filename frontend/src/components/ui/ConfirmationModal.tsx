//frontend/src/components/ui/ConfirmationModal.tsx
"use client";

import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  type?: "danger" | "success" | "warning";
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = "warning",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: "bg-red-50", icon: "text-red-600", btn: "bg-red-600 hover:bg-red-700" },
    warning: { bg: "bg-amber-50", icon: "text-amber-600", btn: "bg-amber-600 hover:bg-amber-700" },
    success: { bg: "bg-emerald-50", icon: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" },
  };

  const style = colors[type];

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${style.bg} ${style.icon}`}>
            {type === 'success' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
          </div>
          
          <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{description}</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${style.btn} ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? "Procesando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};