// frontend/src/components/layout/GlobalImportStatus.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useImport, type ImportProgress } from '@/hooks/useImport';
import { Loader2, CheckCircle2, AlertTriangle, X, FileText, ArrowRight } from 'lucide-react';

export default function GlobalImportStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const { getActiveStatus } = useImport();
  
  const [activeImport, setActiveImport] = useState<ImportProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Evitamos que se muestre doble barra si el usuario ya está en la página de importación
  const isOnImportPage = pathname === '/dashboard/import';

  // Referencia para el intervalo de polling
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para consultar estado
  const checkStatus = async () => {
    try {
      const status = await getActiveStatus();
      
      if (status) {
        // Si hay algo corriendo (o recien terminado con error/exito)
        setActiveImport(status);
        
        const isDone = ['completed', 'finished', 'completed_with_errors', 'failed'].includes(status.status);
        
        if (isDone) {
          setIsFinished(true);
          setIsVisible(true);
          // Si terminó, dejamos de consultar frecuentemente
          stopPolling(); 
        } else {
          setIsFinished(false);
          setIsVisible(true);
        }
      } else {
        // Si no hay nada, ocultamos
        if (!isFinished) {
            setIsVisible(false);
            setActiveImport(null);
        }
      }
    } catch (error) {
      console.error('Error checking global status:', error);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Consultamos cada 4 segundos
    intervalRef.current = setInterval(checkStatus, 4000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Chequeo inicial inmediato
    checkStatus();
    startPolling();

    // Limpieza al desmontar
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si no hay datos, o estamos en la página de importación (y no ha terminado), ocultamos para no duplicar UI
  // PERO: Si ya terminó, sí lo mostramos incluso en la página de importación para dar feedback global
  if (!isVisible || !activeImport || (isOnImportPage && !isFinished)) {
    return null;
  }

  // Cálculos de porcentaje
  const total = activeImport.total_rows || 0;
  const current = activeImport.processed_rows || 0;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  // Determinamos estado visual
  const isError = activeImport.status === 'failed' || activeImport.status === 'error';
  const isWarning = activeImport.status === 'completed_with_errors';
  const isSuccess = activeImport.status === 'completed' || activeImport.status === 'finished';

  const handleClose = () => {
    setIsVisible(false);
    setIsFinished(false); // Reset para permitir detectar nuevas
    startPolling(); // Reiniciar polling por si el usuario inicia otra
  };

  const handleNavigate = () => {
    router.push('/dashboard/import');
    if (isFinished) handleClose(); // Si ya acabó, cerramos al navegar
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-10 duration-500 fade-in">
      <div className={`
        w-80 rounded-2xl shadow-2xl border backdrop-blur-md transition-all
        ${isError ? 'bg-red-50/95 border-red-200' : 
          isSuccess ? 'bg-emerald-50/95 border-emerald-200' : 
          isWarning ? 'bg-amber-50/95 border-amber-200' :
          'bg-white/95 border-slate-200'}
      `}>
        
        {/* Header de la tarjeta */}
        <div className="p-4 border-b border-black/5 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full shadow-sm ${
                isError ? 'bg-red-100 text-red-600' : 
                isSuccess ? 'bg-emerald-100 text-emerald-600' : 
                isWarning ? 'bg-amber-100 text-amber-600' :
                'bg-blue-100 text-blue-600'
            }`}>
               {isFinished ? (
                   isError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />
               ) : (
                   <Loader2 size={18} className="animate-spin" />
               )}
            </div>
            <div>
              <h4 className={`text-sm font-bold leading-none ${
                  isError ? 'text-red-900' : isSuccess ? 'text-emerald-900' : 'text-slate-900'
              }`}>
                {isFinished 
                    ? (isError ? 'Error en Importación' : isWarning ? 'Finalizado con Alertas' : 'Importación Exitosa') 
                    : 'Importando Archivo...'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {isFinished 
                    ? 'El proceso ha concluido.' 
                    : `${percentage}% Completado`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-black/5 p-1 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo / Barra de Progreso */}
        <div className="p-4 pt-3">
            {!isFinished ? (
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <span>Progreso</span>
                        <span>{current} / {total}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 italic truncate max-w-[250px]">
                        {activeImport.current_operation}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/50 p-2 rounded border border-black/5">
                        <FileText size={14} className="opacity-50"/>
                        <span className="truncate flex-1 font-medium">Reporte de Importación</span>
                    </div>
                    <button 
                        onClick={handleNavigate}
                        className={`
                            mt-1 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                            ${isError 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'bg-slate-900 text-white hover:bg-slate-800'}
                        `}
                    >
                        Ver Detalles <ArrowRight size={14} />
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}