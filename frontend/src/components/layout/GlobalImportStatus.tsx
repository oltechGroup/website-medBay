// frontend/src/components/layout/GlobalImportStatus.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useImport, type ImportProgress, type ImportStats } from '@/hooks/useImport';
import { Loader2, CheckCircle2, AlertTriangle, X, FileText, ArrowRight, Package, AlertCircle } from 'lucide-react';

export default function GlobalImportStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const { getActiveStatus } = useImport();
  
  const [activeImport, setActiveImport] = useState<ImportProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const isProcessing = activeImport?.status === 'processing';
  const isOnImportPage = pathname === '/dashboard/import';
  const shouldHide = isDismissed || (!activeImport) || (isOnImportPage && isProcessing);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkStatus = async () => {
    try {
      const status = await getActiveStatus();
      
      if (status) {
        setActiveImport(prev => {
            if (prev && prev.id !== status.id) setIsDismissed(false);
            return status;
        });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error checking global status:', error);
    }
  };

  useEffect(() => {
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (shouldHide || !isVisible || !activeImport) return null;

  const total = activeImport.total_rows || 0;
  const current = activeImport.processed_rows || 0;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const isError = activeImport.status === 'failed' || activeImport.status === 'error';
  const isWarning = activeImport.status === 'completed_with_errors';
  const isSuccess = activeImport.status === 'completed' || activeImport.status === 'finished';
  const isFinished = isError || isWarning || isSuccess;

  // ✅ CORRECCIÓN TYPE SCRIPT: Casteo seguro de estadísticas
  const stats = (activeImport.error_messages?.stats || {}) as Partial<ImportStats>;
  const createdLots = stats.created_lots || 0; // Usamos variable local segura
  const errorCount = activeImport.error_messages?.errors?.length || 0;

  const handleNavigate = () => {
    router.push('/dashboard/import');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsDismissed(true);
  };

  return (
    <div 
      onClick={handleNavigate}
      className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-10 duration-500 fade-in cursor-pointer group"
    >
      <div className={`
        w-80 rounded-2xl shadow-2xl border backdrop-blur-md transition-all transform hover:scale-[1.02]
        ${isError ? 'bg-red-50/95 border-red-200' : 
          isSuccess ? 'bg-emerald-50/95 border-emerald-200' : 
          isWarning ? 'bg-amber-50/95 border-amber-200' :
          'bg-white/95 border-slate-200'}
      `}>
        
        {/* Header */}
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
                    ? (isError ? 'Importación Fallida' : isWarning ? 'Finalizado con Alertas' : 'Importación Exitosa') 
                    : 'Importando Inventario...'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                {isFinished ? 'Clic para ver detalles' : 'Procesando en segundo plano'} <ArrowRight size={10}/>
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-black/10 p-1.5 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-4 pt-3">
            {!isFinished ? (
                // --- ESTADO: PROCESANDO ---
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <span>Progreso</span>
                        <span>{percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 italic truncate">
                        {activeImport.current_operation || 'Procesando datos...'}
                    </p>
                </div>
            ) : (
                // --- ESTADO: TERMINADO (RESUMEN) ---
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/60 p-2 rounded border border-black/5 flex flex-col items-center justify-center text-center">
                        <span className="font-bold text-slate-700 text-lg">{createdLots}</span>
                        <span className="text-slate-500 flex items-center gap-1"><Package size={10}/> Lotes</span>
                    </div>
                    
                    {errorCount > 0 ? (
                        <div className="bg-red-100/50 p-2 rounded border border-red-200 flex flex-col items-center justify-center text-center">
                            <span className="font-bold text-red-700 text-lg">{errorCount}</span>
                            <span className="text-red-600 flex items-center gap-1"><AlertCircle size={10}/> Errores</span>
                        </div>
                    ) : (
                        <div className="bg-emerald-100/50 p-2 rounded border border-emerald-200 flex flex-col items-center justify-center text-center">
                            <span className="font-bold text-emerald-700 text-lg">100%</span>
                            <span className="text-emerald-600">Completado</span>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}