// frontend/src/components/features/inventory/ProductCard.tsx

'use client';

import React from 'react';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { ProductLot } from '@/hooks/useInventory'; // ✅ CORREGIDO: Usar ProductLot en lugar de InventoryItem

interface ProductCardProps {
  product: ProductLot; // ✅ CORREGIDO: Usar ProductLot
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getCategoryColor = (status: string) => {
    switch (status) {
      case 'available': return 'border-green-200 bg-green-50';
      case 'near_expiry': return 'border-amber-200 bg-amber-50';
      case 'expired': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  // ✅ CORREGIDO: Mapear status a etiquetas en español
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'En Fecha';
      case 'near_expiry': return 'Fecha Corta';
      case 'expired': return 'Caducado';
      default: return status;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getCategoryColor(product.status)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.product_name}</h3>
          <p className="text-sm text-gray-600 mb-1">{product.supplier_name}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>SKU: {product.product_code}</span>
            <span>•</span>
            <span>Lote: {product.lot_number}</span>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          product.status === 'available' ? 'bg-green-100 text-green-800' :
          product.status === 'near_expiry' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          {getStatusLabel(product.status)}
        </span>
      </div>

      {/* Descripción */}
      {product.product_description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">{product.product_description}</p>
      )}

      {/* Información del producto */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-2 text-sm">
          <Package className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">Stock: <strong>{product.quantity} unidades</strong></span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">Caduca: <strong>{formatDate(product.expiry_date)}</strong></span>
        </div>
      </div>

      {/* Precio */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
        </div>

        {/* Estado del lote */}
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          product.status === 'available' ? 'bg-green-100 text-green-800' :
          product.status === 'near_expiry' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          {getStatusLabel(product.status)}
        </span>
      </div>
    </div>
  );
};