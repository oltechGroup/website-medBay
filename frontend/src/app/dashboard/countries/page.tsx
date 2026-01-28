//frontend/src/app/dashboard/countries/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useCountries, useCountryStats, useDeleteCountry, useSyncExchangeRates } from '@/hooks/useCountries';
import { Plus, Search, DollarSign, Globe, TrendingUp, Activity, RefreshCw, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { CountryTable } from '@/components/features/countries/CountryTable';
import { CurrencyStats } from '@/components/features/countries/CurrencyStats';
import { CountryCard } from '@/components/features/countries/CountryCard';

// ==========================================
// 🕒 COMPONENTE: TEMPORIZADOR
// ==========================================
const NextUpdateTimer = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      
      // Configurar objetivo para las 2:00 AM
      target.setHours(2, 0, 0, 0);
      
      // Si ya pasaron las 2 AM hoy, el objetivo es mañana
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Ejecutar inmediatamente

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm font-medium text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
      <Clock className="h-4 w-4" />
      <span>Próxima actualización en: {timeLeft}</span>
    </div>
  );
};

// ==========================================
// ✨ COMPONENTE: MODAL DE RESULTADOS
// ==========================================
interface SyncResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: { updated: number; failed: number } | null;
}

const SyncResultModal = ({ isOpen, onClose, stats }: SyncResultModalProps) => {
  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-100">
        
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Sincronización Exitosa</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4">
          <p className="text-gray-600">
            Las tasas de cambio se han actualizado correctamente con los valores más recientes del mercado global.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <span className="block text-2xl font-bold text-green-600">{stats.updated}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Actualizados</span>
              </div>
              <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                <span className={`block text-2xl font-bold ${stats.failed > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {stats.failed}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Fallidos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Botón */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📄 PÁGINA PRINCIPAL
// ==========================================
export default function CountriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit] = useState(10);
  
  // Estado para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncStats, setSyncStats] = useState<{ updated: number; failed: number } | null>(null);

  // Hooks de datos
  const { 
    data: countriesResponse, 
    isLoading, 
    error 
  } = useCountries(currentPage, limit, searchTerm);
  
  const { data: statsResponse } = useCountryStats();
  const { deleteCountry } = useDeleteCountry();
  
  // Hook de sincronización
  const { syncRates, isSyncing } = useSyncExchangeRates();

  const countries = countriesResponse?.data || [];
  const pagination = countriesResponse?.pagination;
  const stats = statsResponse?.data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = async (code: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este país?')) {
      try {
        await deleteCountry(code);
      } catch (error) {
        console.error('Error deleting country:', error);
        alert('Error al eliminar el país. Puede que esté en uso.');
      }
    }
  };

  // 🚀 Función Modificada: Usa el Modal en lugar de alert()
  const handleSync = async () => {
    try {
      const result = await syncRates();
      // Guardamos los datos y abrimos el modal
      setSyncStats({ updated: result.stats.updated, failed: result.stats.failed });
      setIsModalOpen(true);
    } catch (err) {
      alert('Error al sincronizar las tasas. Verifica la conexión con el servidor.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <p className="text-red-800 font-medium">Error al cargar los países: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Modal de Sincronización */}
      <SyncResultModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        stats={syncStats} 
      />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Principal con Panel de Control */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Países</h1>
            <p className="text-gray-500 mt-1">
              Configuración de regiones operativas y tasas de cambio.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Temporizador */}
            <NextUpdateTimer />

            {/* Botón de Sincronización Manual */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                isSyncing 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Actualizando...' : 'Sincronizar Tasas'}</span>
            </button>

            {/* Botón Nuevo País */}
            <Link
              href="/dashboard/countries/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              <span>Nuevo País</span>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CountryCard
              title="Total Países"
              value={stats.totalCountries.toString()}
              icon={<Globe className="h-6 w-6" />}
              color="blue"
            />
            <CountryCard
              title="Monedas Activas"
              value={stats.totalCurrencies.toString()}
              icon={<DollarSign className="h-6 w-6" />}
              color="green"
            />
            <CountryCard
              title="Tasa Promedio"
              value={stats.averageExchangeRate.toFixed(4)}
              icon={<TrendingUp className="h-6 w-6" />}
              color="purple"
            />
            <CountryCard
              title="Rango de Tasas"
              value={`${stats.minExchangeRate.toFixed(2)} - ${stats.maxExchangeRate.toFixed(2)}`}
              icon={<Activity className="h-6 w-6" />}
              color="orange"
            />
          </div>
        )}

        {/* Sección Principal: Gráfico y Tabla */}
        <div className="space-y-6">
          {/* Gráfico de Tasas */}
          {countries.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tendencias de Divisas</h2>
              <CurrencyStats countries={countries} />
            </div>
          )}

          {/* Barra de Herramientas de Tabla */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por país, código o moneda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                // ✅ CORRECCIÓN DE ESTILO: Agregado text-gray-900 y placeholder-gray-500
                className="w-full pl-10 pr-4 py-2 bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              onClick={handleSearch}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Buscar
            </button>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CountryTable
              countries={countries}
              isLoading={isLoading}
              onDelete={handleDelete}
              currentPage={currentPage}
              totalPages={pagination?.totalPages || 1}
              onPageChange={setCurrentPage}
              totalItems={pagination?.total || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}