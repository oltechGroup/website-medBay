//frontend/src/app/dashboard/import/components/ImportHistory.tsx

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useImport } from '@/hooks/useImport';
import { FileText, Calendar, CheckCircle, XCircle, RefreshCw, AlertCircle, BarChart3, Clock, TrendingUp, XSquare } from 'lucide-react';

export const ImportHistory = () => {
  const { getHistory, getStats } = useImport();
  const [history, setHistory] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'all'>('all');

  const fetchData = useCallback(async () => {
    try {
        const [histData, statsData] = await Promise.all([getHistory(), getStats()]);
        if (Array.isArray(histData)) setHistory(histData);
        else setHistory([]);
        if (statsData) setGlobalStats(statsData);
    } catch (err) {
        console.error("History Error:", err);
        setError(true);
    }
  }, [getHistory, getStats]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // --- LÓGICA DE FECHAS NATIVA (SIN LIBRERÍAS) ---
  const filteredHistory = useMemo(() => {
    const now = new Date();
    
    return history.filter(item => {
        if (!item.created_at) return false;
        const date = new Date(item.created_at);
        
        if (timeFilter === 'day') {
            return date.toDateString() === now.toDateString();
        }
        if (timeFilter === 'week') {
            // Calcular inicio de semana (Lunes)
            const day = now.getDay(); 
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(now.setDate(diff));
            monday.setHours(0,0,0,0);
            return date >= monday;
        }
        if (timeFilter === 'month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true;
    });
  }, [history, timeFilter]);

  // Formateador de fecha nativo en Español
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  const getCategoryLabel = (cat: string) => {
      const map: any = { 'regular': 'En Fecha', 'near_expiry': 'Fecha Corta', 'expired': 'Caducado' };
      return map[cat] || cat;
  };

  if (loading && history.length === 0) return <div className="p-12 text-center text-gray-400 font-medium">Cargando historial...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Dashboard Stats */}
      {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><BarChart3 className="w-6 h-6"/></div>
                  <div>
                      <div className="text-2xl font-bold text-gray-900">{globalStats.imports_today || 0}</div>
                      <div className="text-sm text-gray-500">Importaciones Hoy</div>
                  </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><TrendingUp className="w-6 h-6"/></div>
                  <div>
                      <div className="text-2xl font-bold text-gray-900">{globalStats.total_imports || 0}</div>
                      <div className="text-sm text-gray-500">Total Histórico</div>
                  </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4 overflow-hidden">
                  <div className="p-3 bg-green-50 text-green-600 rounded-full flex-shrink-0"><Clock className="w-6 h-6"/></div>
                  <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {globalStats.last_import_supplier !== '-' ? globalStats.last_import_supplier : 'Sin datos'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {formatDate(globalStats.last_import_date)}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
                         {getCategoryLabel(globalStats.last_import_category)}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Lista */}
      <div>
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-bold text-gray-900">Historial</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                      {['all', 'month', 'week', 'day'].map((t) => (
                          <button 
                            key={t}
                            onClick={() => setTimeFilter(t as any)}
                            className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${timeFilter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {t === 'all' ? 'Todos' : t === 'day' ? 'Hoy' : t === 'week' ? 'Semana' : 'Mes'}
                          </button>
                      ))}
                  </div>
              </div>
              
              <button 
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Actualizar lista"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}/>
              </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2"/>
                Error al cargar el historial.
            </div>
          )}

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
                 <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                    <p className="text-gray-500 font-medium">No hay importaciones en este periodo.</p>
                 </div>
            ) : (
                filteredHistory.map((item) => {
                    const s = item.status;
                    const isSuccess = s === 'completed' || s === 'finished';
                    const isCancelled = s === 'processing' || s === 'uploaded'; 
                    const isWarning = s === 'completed_with_errors';
                    
                    const stats = item.error_messages?.stats || {};
                    const lotsCreated = stats.created_lots || 0;

                    return (
                      <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full transition-colors ${
                            isSuccess ? 'bg-green-100 text-green-600' : 
                            isWarning ? 'bg-yellow-100 text-yellow-600' :
                            isCancelled ? 'bg-gray-100 text-gray-400' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {isSuccess ? <CheckCircle size={20}/> : 
                             isWarning ? <AlertCircle size={20}/> :
                             isCancelled ? <XSquare size={20}/> :
                             <XCircle size={20}/>}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{item.filename}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                              <span className="flex items-center capitalize">
                                <Calendar size={14} className="mr-1"/> 
                                {formatDate(item.created_at)}
                              </span>
                              <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                              <span className="font-medium text-gray-700">{item.supplier}</span>
                              <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                item.sales_category === 'near_expiry' ? 'bg-yellow-100 text-yellow-700' :
                                item.sales_category === 'expired' ? 'bg-red-100 text-red-700' :
                                'bg-green-100 text-green-700'
                              }`}>{getCategoryLabel(item.sales_category)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 tabular-nums">
                            {lotsCreated > 0 ? lotsCreated : (isSuccess ? '0' : '-')}
                          </div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                              {isCancelled ? 'Cancelado' : 'Lotes Creados'}
                          </div>
                        </div>
                      </div>
                    );
                })
            )}
          </div>
      </div>
    </div>
  );
};