// frontend/src/app/dashboard/inventory/[supplier_id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building, 
  Package, 
  Calendar, 
  ArrowLeft,
  Tag,
  BarChart3,
  Upload,
  Eye,
  DollarSign,
  Box,
  ShoppingCart
} from 'lucide-react';
import { useInventory, SupplierMetrics } from '@/hooks/useInventory';
import Link from 'next/link';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getSuppliersMetrics, loading } = useInventory();
  
  const [supplier, setSupplier] = useState<SupplierMetrics | null>(null);

  useEffect(() => {
    loadSupplierData();
  }, [params.supplier_id]);

  const loadSupplierData = async () => {
    try {
      const suppliers = await getSuppliersMetrics();
      const foundSupplier = suppliers.find(s => s.id === params.supplier_id);
      setSupplier(foundSupplier || null);
    } catch (error) {
      console.error('Error loading supplier data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  if (loading && !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Proveedor no encontrado</h3>
            <p className="text-gray-500 mb-6">El proveedor que buscas no existe o no está disponible.</p>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inventario
            </button>
          </div>
        </div>
      </div>
    );
  }

  const catalogStats = [
    {
      title: 'Lotes en Fecha',
      value: supplier.available_lots,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Package,
      description: 'Lotes con fecha vigente',
      link: `/dashboard/inventory/${supplier.id}/available`
    },
    {
      title: 'Lotes Fecha Corta',
      value: supplier.near_expiry_lots,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: Calendar,
      description: 'Lotes próximos a caducar',
      link: `/dashboard/inventory/${supplier.id}/near-expiry`
    },
    {
      title: 'Lotes Caducados',
      value: supplier.expired_lots,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: Tag,
      description: 'Lotes vencidos',
      link: `/dashboard/inventory/${supplier.id}/expired`
    }
  ];

  // Calcular porcentajes para la barra de progreso
  const totalLots = supplier.total_lots || 1;
  const availablePercent = (supplier.available_lots / totalLots) * 100;
  const nearExpiryPercent = (supplier.near_expiry_lots / totalLots) * 100;
  const expiredPercent = (supplier.expired_lots / totalLots) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/inventory')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inventario
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{supplier.supplier_name}</h1>
                <p className="text-gray-600">
                  Gestión de catálogos y productos de este proveedor
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/import?supplier_id=${supplier.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Catálogo
              </Link>
              
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all">
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </button>
            </div>
          </div>
        </div>

        {/* 🎯 ESTADÍSTICAS PRINCIPALES MEJORADAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 🏷️ PRODUCTOS ÚNICOS */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos Únicos</p>
                <p className="text-2xl font-bold text-gray-900">{supplier.unique_products}</p>
                <p className="text-xs text-gray-500 mt-1">Productos diferentes</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* 📦 LOTES ACTIVOS */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lotes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{supplier.active_lots}</p>
                <p className="text-xs text-gray-500 mt-1">Con stock disponible</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Box className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* 🛒 UNIDADES EN STOCK */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unidades en Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {supplier.total_units?.toLocaleString('es-MX')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Inventario total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* 💰 VALOR REAL DEL INVENTARIO */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor del Inventario</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(supplier.total_value)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Valor real en MXN</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 📊 CATEGORÍAS DE LOTES */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribución de Lotes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catalogStats.map((stat, index) => (
              <Link
                key={index}
                href={stat.link}
                className="block"
              >
                <div className={`border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer ${stat.bgColor} ${stat.borderColor}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{stat.title}</h3>
                      <p className="text-sm text-gray-600">{stat.description}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                      Ver Catálogo
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 📈 BARRA DE PROGRESO DEL PROVEEDOR */}
        {supplier.total_lots > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Lotes</h3>
            
            {/* Barra de progreso */}
            <div className="flex w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              {supplier.available_lots > 0 && (
                <div 
                  className="bg-green-500 h-3 transition-all duration-300"
                  style={{ width: `${availablePercent}%` }}
                  title={`${supplier.available_lots} lotes en fecha`}
                />
              )}
              {supplier.near_expiry_lots > 0 && (
                <div 
                  className="bg-amber-500 h-3 transition-all duration-300"
                  style={{ width: `${nearExpiryPercent}%` }}
                  title={`${supplier.near_expiry_lots} lotes fecha corta`}
                />
              )}
              {supplier.expired_lots > 0 && (
                <div 
                  className="bg-red-500 h-3 transition-all duration-300"
                  style={{ width: `${expiredPercent}%` }}
                  title={`${supplier.expired_lots} lotes caducados`}
                />
              )}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap justify-between text-sm text-gray-600 gap-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>En fecha: {supplier.available_lots} lotes</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <span>Fecha corta: {supplier.near_expiry_lots} lotes</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Caducados: {supplier.expired_lots} lotes</span>
              </div>
            </div>
          </div>
        )}

        {/* ℹ️ INFORMACIÓN DEL PROVEEDOR MEJORADA */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Proveedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Última Importación</p>
                  <p className="font-medium text-gray-900 mb-2">
                    {formatDateTime(supplier.last_import)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Categoría: Pendiente de implementación
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Estado del Proveedor</p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="font-medium text-green-600">Activo</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {supplier.total_lots > 0 ? 'Con inventario activo' : 'Sin inventario activo'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg ml-4">
              <BarChart3 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}