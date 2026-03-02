// frontend/src/components/features/inventory/SupplierCard.tsx

'use client';

import React from 'react';
import { Building, Package, Calendar, ArrowRight, Tag, Box, ShoppingCart, Stethoscope } from 'lucide-react';
import { SupplierMetrics } from '@/hooks/useInventory';

interface SupplierCardProps {
  supplier: SupplierMetrics & { equipment_lots?: number }; // Extendemos el tipo para incluir la nueva métrica
  onClick: (supplierId: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'near_expiry': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'equipment': return 'bg-blue-100 text-blue-800 border-blue-200'; // ✅ NUEVA CATEGORÍA
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No imports found';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const totalLots = supplier.total_lots || 1;
  const availablePercent = ((supplier.available_lots || 0) / totalLots) * 100;
  const nearExpiryPercent = ((supplier.near_expiry_lots || 0) / totalLots) * 100;
  const expiredPercent = ((supplier.expired_lots || 0) / totalLots) * 100;
  const equipmentPercent = ((supplier.equipment_lots || 0) / totalLots) * 100; // ✅ NUEVO PORCENTAJE

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
            <p className="text-sm text-gray-500">Last import: {formatDate(supplier.last_import)}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>

      {/* 🎯 CLEAR METRICS - 3 COMPACT COLUMNS */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        {/* 🏷️ UNIQUE PRODUCTS */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs font-medium text-purple-800 mb-1">
            <Tag className="h-3 w-3" />
            <span>Products</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{supplier.unique_products || 0}</p>
          <p className="text-xs text-gray-500">unique</p>
        </div>

        {/* 📦 ACTIVE LOTS */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs font-medium text-blue-800 mb-1">
            <Box className="h-3 w-3" />
            <span>Lots</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{supplier.active_lots || 0}</p>
          <p className="text-xs text-gray-500">active</p>
        </div>

        {/* 🛒 UNITS IN STOCK */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-xs font-medium text-green-800 mb-1">
            <ShoppingCart className="h-3 w-3" />
            <span>Units</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {(supplier.total_units || 0).toLocaleString('en-US')}
          </p>
          <p className="text-xs text-gray-500">in stock</p>
        </div>
      </div>

      {/* 📊 STATUS METRICS - AHORA 5 CATEGORÍAS (Usando grid flex o columns dinámicas) */}
      <div className="flex flex-wrap gap-2 justify-between mb-4">
        <div className="text-center flex-1 min-w-[30%]">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap ${getCategoryColor('available')}`}>
            <Package className="h-3 w-3 mr-1" />
            On Date
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{supplier.available_lots || 0}</p>
        </div>

        <div className="text-center flex-1 min-w-[30%]">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap ${getCategoryColor('near_expiry')}`}>
            <Calendar className="h-3 w-3 mr-1" />
            Short Date
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{supplier.near_expiry_lots || 0}</p>
        </div>

        <div className="text-center flex-1 min-w-[30%]">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap ${getCategoryColor('expired')}`}>
            <Calendar className="h-3 w-3 mr-1" />
            Expired
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{supplier.expired_lots || 0}</p>
        </div>

        <div className="text-center flex-1 min-w-[30%]">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap ${getCategoryColor('equipment')}`}>
            <Stethoscope className="h-3 w-3 mr-1" />
            Equip
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1">{supplier.equipment_lots || 0}</p>
        </div>

        <div className="text-center flex-1 min-w-[30%]">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">
            <Package className="h-3 w-3 mr-1" />
            Total
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">{supplier.total_lots || 0}</p>
        </div>
      </div>

      {/* 📊 IMPROVED PROGRESS BAR */}
      {supplier.total_lots > 0 && (
        <>
          <div className="flex w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
            {/* Available Segment (On Date) */}
            {availablePercent > 0 && (
              <div 
                className="bg-green-500 h-2 transition-all duration-300"
                style={{ width: `${availablePercent}%` }}
                title={`${supplier.available_lots} lots on date`}
              />
            )}
            
            {/* Near Expiry Segment (Short Date) */}
            {nearExpiryPercent > 0 && (
              <div 
                className="bg-amber-500 h-2 transition-all duration-300"
                style={{ width: `${nearExpiryPercent}%` }}
                title={`${supplier.near_expiry_lots} lots near expiry`}
              />
            )}
            
            {/* Expired Segment */}
            {expiredPercent > 0 && (
              <div 
                className="bg-red-500 h-2 transition-all duration-300"
                style={{ width: `${expiredPercent}%` }}
                title={`${supplier.expired_lots} expired lots`}
              />
            )}

            {/* Equipment Segment ✅ */}
            {equipmentPercent > 0 && (
              <div 
                className="bg-blue-500 h-2 transition-all duration-300"
                style={{ width: `${equipmentPercent}%` }}
                title={`${supplier.equipment_lots} equipment lots`}
              />
            )}
          </div>

          {/* Progress bar legend - Minimalista */}
          <div className="flex flex-wrap justify-between text-[10px] text-gray-500">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              <span>On date</span>
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1"></div>
              <span>Short date</span>
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
              <span>Expired</span>
            </div>
             <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
              <span>Equip</span>
            </div>
          </div>
        </>
      )}

      {/* Message when there are no lots */}
      {(!supplier.total_lots || supplier.total_lots === 0) && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">No active lots</p>
        </div>
      )}
    </div>
  );
};