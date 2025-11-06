'use client';

import { useState, useEffect } from 'react';
import { useImport } from '@/hooks/useImport';
import { useSuppliers } from '@/hooks/useSuppliers';
import { UploadWizard } from './components/UploadWizard';
import { ImportHistory } from './components/ImportHistory';
import { FileText, TrendingUp, Clock, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface ImportStats {
  imports_today: number;
  imports_this_month: number;
  total_imports: number;
  last_import_date: string;
  last_import_supplier: string;
  last_import_category: string;
}

export default function ImportPage() {
  const { suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { getImportStats } = useImport();
  const [session, setSession] = useState({
    id: '1',
    status: 'selecting' as const,
    sales_category: 'regular' as const,
  });
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar estadísticas reales
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await getImportStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      // Valores por defecto en caso de error
      setStats({
        imports_today: 0,
        imports_this_month: 0,
        total_imports: 0,
        last_import_date: '',
        last_import_supplier: '',
        last_import_category: 'regular'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Función para actualizar todos los datos
  const refreshAllData = async () => {
    setRefreshing(true);
    await loadStats();
    
    // Si estamos en la pestaña de historial, forzar recarga del historial también
    if (activeTab === 'history') {
      // Disparar un evento personalizado que el historial puede escuchar
      window.dispatchEvent(new CustomEvent('refreshHistory'));
    }
    
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'regular': return 'En Fecha';
      case 'near_expiry': return 'Fecha Cerca';
      case 'expired': return 'Caducados';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'regular': return 'text-green-600 bg-green-100';
      case 'near_expiry': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'No hay importaciones';
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Mejorado con Botón de Actualización */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Importación de Catálogos</h1>
              <p className="text-gray-600 mt-2">
                Gestión profesional de importación de inventario por proveedores
              </p>
            </div>
            
            {/* Botón de Actualización */}
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
            </button>
          </div>
        </div>

        {/* Tarjetas de Estadísticas en tiempo real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Importaciones Hoy */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Importaciones Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.imports_today || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Importaciones Este Mes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.imports_this_month || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Importaciones */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Importaciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.total_imports || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Última Importación */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Última Importación</p>
                <p className="text-lg font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.last_import_supplier || 'Ninguna'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.last_import_date ? formatDateTime(stats.last_import_date) : 'No hay datos'}
                </p>
                {stats?.last_import_category && (
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(stats.last_import_category)}`}>
                    {getCategoryLabel(stats.last_import_category)}
                  </span>
                )}
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por Pestañas */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('import')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Nueva Importación</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Historial de Importaciones</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Principal */}
          <div className="lg:col-span-2">
            {activeTab === 'import' ? (
              <div className="space-y-6">
                <UploadWizard
                  session={session}
                  setSession={setSession}
                  suppliers={suppliers}
                  suppliersLoading={suppliersLoading}
                />
              </div>
            ) : (
              <ImportHistory />
            )}
          </div>

          {/* Panel Lateral - Información Contextual */}
          <div className="space-y-6">
            {/* Resumen de Proceso */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>¿Cómo funciona el proceso?</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    step: '1',
                    title: 'Selección',
                    description: 'Proveedor y categoría',
                    icon: '🏢'
                  },
                  {
                    step: '2',
                    title: 'Limpieza',
                    description: 'Catálogo anterior',
                    icon: '🧹'
                  },
                  {
                    step: '3',
                    title: 'Carga',
                    description: 'Archivo Excel',
                    icon: '📤'
                  },
                  {
                    step: '4',
                    title: 'Procesamiento',
                    description: 'Datos automáticos',
                    icon: '⚙️'
                  }
                ].map((item) => (
                  <div key={item.step} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips y Mejores Prácticas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Mejores Prácticas</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Verifica el formato de fechas antes de importar</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Limpia siempre el catálogo anterior</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Revisa el mapeo de columnas cuidadosamente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}