// frontend/src/components/ui/QuantitySelector.tsx

"use client";

import { Plus, Minus, Loader2 } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  max?: number; // Stock máximo disponible del lote
  disabled?: boolean;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg"; // Para adaptar a diferentes espacios
}

export const QuantitySelector = ({
  quantity,
  onIncrease,
  onDecrease,
  max,
  disabled = false,
  isLoading = false,
  size = "md"
}: QuantitySelectorProps) => {
  
  // Clases de tamaño
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div className={`flex items-center bg-slate-100 rounded-lg p-1 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Botón Menos */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Evita clicks fantasma en tarjetas padre
          onDecrease();
        }}
        disabled={quantity <= 1 || disabled || isLoading}
        className={`
          flex items-center justify-center bg-white text-slate-500 rounded-md shadow-sm transition-all
          hover:text-blue-600 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
        `}
        title="Disminuir cantidad"
      >
        <Minus size={iconSizes[size]} />
      </button>

      {/* Display Numérico */}
      <div className={`
        font-bold text-slate-800 text-center flex items-center justify-center px-2 select-none
        ${size === 'sm' ? 'w-8 text-xs' : size === 'lg' ? 'w-14 text-lg' : 'w-10 text-sm'}
      `}>
        {isLoading ? (
          <Loader2 className="animate-spin text-blue-500" size={iconSizes[size]} />
        ) : (
          quantity
        )}
      </div>

      {/* Botón Más */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
        disabled={(max !== undefined && quantity >= max) || disabled || isLoading}
        className={`
          flex items-center justify-center bg-white text-slate-500 rounded-md shadow-sm transition-all
          hover:text-blue-600 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
        `}
        title={max ? `Máximo disponible: ${max}` : "Aumentar cantidad"}
      >
        <Plus size={iconSizes[size]} />
      </button>
    </div>
  );
};