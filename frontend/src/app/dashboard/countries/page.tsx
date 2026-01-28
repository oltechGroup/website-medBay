'use client';

import { useState, useEffect } from 'react';
import { useCountries, useCountryStats, useDeleteCountry, useSyncExchangeRates } from '@/hooks/useCountries';
import { Plus, Search, DollarSign, Globe, TrendingUp, Activity, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { CountryTable } from '@/components/features/countries/CountryTable';
import { CurrencyStats } from '@/components/features/countries/CurrencyStats';
import { CountryCard } from '@/components/features/countries/CountryCard';

// Componente auxiliar para el Temporizador
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
    <div className="flex items-center space-x-2 text-sm font-medium text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
      <Clock className="h-4 w-4" />
      <span>Próxima actualización en: {timeLeft}</span>
    </div>
  );
};

export default function CountriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit] = useState(10);

  // Hooks de datos
  const { 
    data: countriesResponse, 
    isLoading, 
    error 
  } = useCountries(currentPage, limit, searchTerm);
  
  const { data: statsResponse } = useCountryStats();
  const { deleteCountry } = useDeleteCountry();
  
  // 🚀 NUEVO HOOK DE SINCRONIZACIÓN
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

  // 🚀 Función para ejecutar la sincronización manual
  const handleSync = async () => {
    try {
      const result = await syncRates();
      // Podemos mostrar una notificación toast aquí si tienes un sistema de notificaciones
      alert(`Sincronización completada.\nActualizados: ${result.stats.updated}\nFallidos: ${result.stats.failed}`);
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
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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