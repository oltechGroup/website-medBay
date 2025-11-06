'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Eye, Search, Loader, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface ImportHistoryItem {
  id: string;
  fecha: string;
  proveedor: string;
  categoria: 'regular' | 'near_expiry' | 'expired';
  filas_procesadas: number;
  lotes_creados: number;
  estado: 'completado' | 'error';
  archivo: string;
}

export const ImportHistory = () => {
  const [timeFilter, setTimeFilter] = useState<'hoy' | 'semana' | 'mes' | 'total'>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyData, setHistoryData] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos reales del backend
  const loadRealHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Cargando historial real de importaciones...');
      
      const response = await api.get('/import/history');
      
      console.log('✅ Datos reales recibidos:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Transformar datos reales al formato que espera el frontend
        const transformedData: ImportHistoryItem[] = response.data.map((item: any) => {
          // Determinar la categoría basada en el nombre del archivo
          let categoria: 'regular' | 'near_expiry' | 'expired' = 'regular';
          const filename = item.filename?.toLowerCase() || item.archivo?.toLowerCase() || '';
          
          if (filename.includes('caducado') || filename.includes('expired')) {
            categoria = 'expired';
          } else if (filename.includes('corta') || filename.includes('near')) {
            categoria = 'near_expiry';
          }
          
          // Determinar estado
          let estado: 'completado' | 'error' = 'completado';
          if (item.status && item.status !== 'uploaded' && item.status !== 'completed') {
            estado = 'error';
          }
          
          // Usar el nombre limpio del backend, o limpiarlo aquí si no viene
          let archivoLimpio = item.clean_filename || item.filename || item.archivo || '';
          if (!item.clean_filename && archivoLimpio) {
            // Limpiar en el frontend como respaldo
            archivoLimpio = archivoLimpio.replace(/^import-\d+-/, '');
          }
          
          return {
            id: item.id,
            fecha: item.created_at || item.fecha,
            proveedor: item.supplier_name || item.proveedor || 'Proveedor',
            categoria: categoria,
            filas_procesadas: item.row_count || item.filas_procesadas || 0,
            lotes_creados: item.lots_created || item.lotes_creados || 0,
            estado: estado,
            archivo: archivoLimpio
          };
        });
        
        setHistoryData(transformedData);
      } else {
        console.warn('Formato de datos inesperado:', response.data);
        setHistoryData([]);
      }
    } catch (err: any) {
      console.error('❌ Error cargando historial real:', err);
      setError(err.response?.data?.error || 'No se pudo cargar el historial de importaciones.');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial al cambiar filtro
  useEffect(() => {
    loadRealHistory();
  }, [timeFilter]);

  // Escuchar evento de actualización desde la página principal
  useEffect(() => {
    const handleRefreshHistory = () => {
      console.log('🔄 Evento de actualización recibido en historial');
      loadRealHistory();
    };

    window.addEventListener('refreshHistory', handleRefreshHistory);
    
    return () => {
      window.removeEventListener('refreshHistory', handleRefreshHistory);
    };
  }, []);

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'regular': return 'bg-green-100 text-green-800';
      case 'near_expiry': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (categoria: string) => {
    switch (categoria) {
      case 'regular': return 'En Fecha';
      case 'near_expiry': return 'Fecha Cerca';
      case 'expired': return 'Caducados';
      default: return categoria;
    }
  };

  const getStatusColor = (estado: string) => {
    return estado === 'completado' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      return new Date(dateString).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const filteredData = historyData.filter(item =>
    item.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.archivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-lg font-medium text-gray-900">Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={loadRealHistory}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header del Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
          Historial de Importaciones ({historyData.length})
        </h2>
        
        <div className="flex items-center space-x-3">
          {/* Filtro de Tiempo */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'hoy', label: 'Hoy' },
              { key: 'semana', label: 'Semana' },
              { key: 'mes', label: 'Mes' },
              { key: 'total', label: 'Total' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTimeFilter(filter.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === filter.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button 
            onClick={loadRealHistory}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor o archivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Historial */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron importaciones' : 'No hay importaciones en el historial'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Intenta con otro término de búsqueda' 
                : 'Las importaciones aparecerán aquí automáticamente'
              }
            </p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <h3 className="font-semibold text-gray-900">{item.proveedor}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.categoria)}`}>
                      {getCategoryLabel(item.categoria)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.estado)}`}>
                      {item.estado === 'completado' ? '✅ Completado' : '❌ Error'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Archivo:</span> {item.archivo}
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span> {formatDateTime(item.fecha)}
                    </div>
                    <div>
                      <span className="font-medium">Resultado:</span> {item.filas_procesadas} filas → {item.lotes_creados} lotes
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    title="Ver detalles"
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredData.length}</span> de{' '}
            <span className="font-medium">{filteredData.length}</span> resultados
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};