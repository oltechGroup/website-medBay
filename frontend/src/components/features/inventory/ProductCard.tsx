'use client';

import React from 'react';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';

interface ProductCardProps {
  product: InventoryItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'regular': return 'border-green-200 bg-green-50';
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

  return (
    <div className={`border rounded-lg p-4 ${getCategoryColor(product.sales_category)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.product_name}</h3>
          <p className="text-sm text-gray-600 mb-1">{product.manufacturer_name}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>SKU: {product.product_code}</span>
            <span>•</span>
            <span>Lote: {product.lot_number}</span>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Disponible
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
            {formatCurrency(product.price_amount)}
          </span>
        </div>

        {/* Categoría de venta */}
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          product.sales_category === 'regular' ? 'bg-green-100 text-green-800' :
          product.sales_category === 'near_expiry' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          {product.sales_category === 'regular' ? 'En Fecha' :
           product.sales_category === 'near_expiry' ? 'Fecha Corta' : 'Caducado'}
        </span>
      </div>
    </div>
  );
};