'use client';

import { useState } from 'react';
import { useCountries, useCountryStats, useDeleteCountry } from '@/hooks/useCountries';
import { Plus, Search, DollarSign, Globe, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { CountryTable } from '@/components/features/countries/CountryTable';
import { CurrencyStats } from '@/components/features/countries/CurrencyStats';
import { CountryCard } from '@/components/features/countries/CountryCard';

export default function CountriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit] = useState(10);

  const { 
    data: countriesResponse, 
    isLoading, 
    error 
  } = useCountries(currentPage, limit, searchTerm);
  
  const { data: statsResponse } = useCountryStats();
  const { deleteCountry, isDeleting, deleteError } = useDeleteCountry(); // ✅ CORREGIDO

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
        await deleteCountry(code); // ✅ CORREGIDO - usa deleteCountry directamente
      } catch (error) {
        console.error('Error deleting country:', error);
        alert('Error al eliminar el país. Puede que esté en uso.');
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error al cargar los países: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Países</h1>
              <p className="text-gray-600 mt-2">
                Administra los países donde opera MedBay y configura las monedas
              </p>
            </div>
            <Link
              href="/dashboard/countries/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Nuevo País</span>
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <CountryCard
              title="Total Países"
              value={stats.totalCountries.toString()}
              icon={<Globe className="h-6 w-6" />}
              color="blue"
            />
            <CountryCard
              title="Monedas Soportadas"
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

        {/* Gráfico de Tasas de Cambio */}
        {countries.length > 0 && (
          <div className="mb-8">
            <CurrencyStats countries={countries} />
          </div>
        )}

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar países por nombre, código o moneda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Tabla de Países */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
  );
}