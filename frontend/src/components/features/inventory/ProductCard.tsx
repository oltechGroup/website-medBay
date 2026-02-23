// frontend/src/components/features/inventory/ProductCard.tsx

'use client';

import React from 'react';
import { Package, Calendar, DollarSign, Tag } from 'lucide-react';
import { ProductLot } from '@/hooks/useInventory';

interface ProductCardProps {
  product: ProductLot;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': 
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'near_expiry': 
        return {
          bg: 'bg-amber-50', 
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'expired': 
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800 border-red-200'
        };
      default: 
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return '🟢 Current';
      case 'near_expiry': return '🟡 Short-Date';
      case 'expired': return '🔴 Expired';
      default: return status;
    }
  };

  const colors = getStatusColor(product.status);

  return (
    <div className={`border-2 rounded-xl p-4 ${colors.bg} ${colors.border} hover:shadow-md transition-all duration-200`}>
      {/* Compact Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
            {product.product_name}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <Tag className="h-3 w-3" />
              <span className="font-medium">{product.product_code}</span>
            </div>
            <span>•</span>
            <span className="font-medium">Lot: {product.lot_number}</span>
          </div>
        </div>
        
        {/* Status Badge - Only once */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors.badge} whitespace-nowrap ml-2`}>
          {getStatusLabel(product.status).split(' ')[1]} {/* Only text, without emoji */}
        </span>
      </div>

      {/* Supplier */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700">{product.supplier_name}</p>
        {product.manufacturer_name && (
          <p className="text-xs text-gray-600">Manufacturer: {product.manufacturer_name}</p>
        )}
      </div>

      {/* Description - Only if it exists and with better format */}
      {product.product_description && (
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
            {product.product_description}
          </p>
        </div>
      )}

      {/* Critical Information - Better Organized */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white rounded-lg border border-gray-200">
            <Package className="h-3 w-3 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Stock</p>
            <p className="text-sm font-bold text-gray-900">{product.quantity} units</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white rounded-lg border border-gray-200">
            <Calendar className="h-3 w-3 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Expires</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(product.expiry_date)}</p>
          </div>
        </div>
      </div>

      {/* Price and Total Value - With better hierarchy */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">Unit price</p>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-1">Total value</p>
            <p className="text-base font-bold text-blue-600">
              {formatCurrency(product.quantity * product.price)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};