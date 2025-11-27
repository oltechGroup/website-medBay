// frontend/src/components/features/inventory/SupplierCard.tsx

'use client';

import React from 'react';
import { Building, Package, Calendar, ArrowRight, Tag, Box, ShoppingCart } from 'lucide-react';
import { SupplierMetrics } from '@/hooks/useInventory';

interface SupplierCardProps {
  supplier: SupplierMetrics;
  onClick: (supplierId: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'near_expiry': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No hay importaciones';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  // ✅ CORREGIDO: Usar las propiedades correctas de SupplierMetrics
  const totalLots = supplier.total_lots || 1;
  const availablePercent = ((supplier.available_lots || 0) / totalLots) * 100;
  const nearExpiryPercent = ((supplier.near_expiry_lots || 0) / totalLots) * 100;
  const expiredPercent = ((supplier.expired_lots || 0) / totalLots) * 100;

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(supplier.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{supplier.supplier_name}</h3>
            <p className="text-sm text-gray-500">Última importación: {formatDate(supplier.last_import)}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>

      {/* 🎯 MÉTRICAS CLARAS - 3 COLUMNAS COMPACTAS */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        {/* 🏷️ PRODUCTOS ÚNICOS */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs font-medium text-purple-800 mb-1">
            <Tag className="h-3 w-3" />
            <span>Productos</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{supplier.unique_products || 0}</p>
          <p className="text-xs text-gray-500">únicos</p>
        </div>

        {/* 📦 LOTES ACTIVOS */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs font-medium text-blue-800 mb-1">
            <Box className="h-3 w-3" />
            <span>Lotes</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{supplier.active_lots || 0}</p>
          <p className="text-xs text-gray-500">activos</p>
        </div>

        {/* 🛒 UNIDADES EN STOCK */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs font-medium text-green-800 mb-1">
            <ShoppingCart className="h-3 w-3" />
            <span>Unidades</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {(supplier.total_units || 0).toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-gray-500">en stock</p>
        </div>
      </div>

      {/* 📊 MÉTRICAS DE ESTADO - 4 CATEGORÍAS CON COLORES - CORREGIDO */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* ✅ CORREGIDO: available_lots en lugar de regular_lots */}
        <div className="text-center">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor('available')}`}>
            <Package className="h-3 w-3 mr-1" />
            En Fecha
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">{supplier.available_lots || 0}</p>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor('near_expiry')}`}>
            <Calendar className="h-3 w-3 mr-1" />
            Fecha Corta
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">{supplier.near_expiry_lots || 0}</p>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor('expired')}`}>
            <Calendar className="h-3 w-3 mr-1" />
            Caducados
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">{supplier.expired_lots || 0}</p>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <Package className="h-3 w-3 mr-1" />
            Total
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1">{supplier.total_lots || 0}</p>
        </div>
      </div>

      {/* 📊 BARRA DE PROGRESO MEJORADA - CORREGIDA */}
      {supplier.total_lots > 0 && (
        <>
          <div className="flex w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
            {/* Segmento Available (En Fecha) */}
            {availablePercent > 0 && (
              <div 
                className="bg-green-500 h-2 transition-all duration-300"
                style={{ width: `${availablePercent}%` }}
                title={`${supplier.available_lots} lotes en fecha`}
              />
            )}
            
            {/* Segmento Near Expiry (Fecha Corta) */}
            {nearExpiryPercent > 0 && (
              <div 
                className="bg-amber-500 h-2 transition-all duration-300"
                style={{ width: `${nearExpiryPercent}%` }}
                title={`${supplier.near_expiry_lots} lotes cerca de expirar`}
              />
            )}
            
            {/* Segmento Expired (Caducados) */}
            {expiredPercent > 0 && (
              <div 
                className="bg-red-500 h-2 transition-all duration-300"
                style={{ width: `${expiredPercent}%` }}
                title={`${supplier.expired_lots} lotes expirados`}
              />
            )}
          </div>

          {/* Leyenda de la barra de progreso - CORREGIDA */}
          <div className="flex justify-between text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>En fecha: {supplier.available_lots || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
              <span>Fecha corta: {supplier.near_expiry_lots || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span>Caducados: {supplier.expired_lots || 0}</span>
            </div>
          </div>
        </>
      )}

      {/* Mensaje cuando no hay lotes */}
      {(!supplier.total_lots || supplier.total_lots === 0) && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">No hay lotes activos</p>
        </div>
      )}
    </div>
  );
};