'use client';

import React from 'react';
import { Building, Package, Calendar, ArrowRight } from 'lucide-react';
import { SupplierSummary } from '@/hooks/useInventory';

interface SupplierCardProps {
  supplier: SupplierSummary;
  onClick: (supplierId: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'regular': return 'bg-green-100 text-green-800 border-green-200';
      case 'near_expiry': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No hay importaciones';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

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

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor('regular')}`}>
            <Package className="h-3 w-3 mr-1" />
            En Fecha
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{supplier.regular_products}</p>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor('near_expiry')}`}>
            <Calendar className="h-3 w-3 mr-1" />
            Fecha Corta
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{supplier.near_expiry_products}</p>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor('expired')}`}>
            <Calendar className="h-3 w-3 mr-1" />
            Caducados
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{supplier.expired_products}</p>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <Package className="h-3 w-3 mr-1" />
            Total
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{supplier.total_products}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-green-500 h-2 rounded-full" 
          style={{ width: `${(supplier.regular_products / supplier.total_products) * 100}%` }}
        ></div>
        <div 
          className="bg-amber-500 h-2 rounded-full -mt-2" 
          style={{ width: `${(supplier.near_expiry_products / supplier.total_products) * 100}%`, marginLeft: `${(supplier.regular_products / supplier.total_products) * 100}%` }}
        ></div>
        <div 
          className="bg-red-500 h-2 rounded-full -mt-2" 
          style={{ width: `${(supplier.expired_products / supplier.total_products) * 100}%`, marginLeft: `${((supplier.regular_products + supplier.near_expiry_products) / supplier.total_products) * 100}%` }}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>En fecha: {supplier.regular_products}</span>
        <span>Fecha corta: {supplier.near_expiry_products}</span>
        <span>Caducados: {supplier.expired_products}</span>
      </div>
    </div>
  );
};