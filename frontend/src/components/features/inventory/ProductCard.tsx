// frontend/src/components/features/inventory/ProductCard.tsx

'use client';

import React from 'react';
import { Package, Calendar, DollarSign, Tag, Stethoscope, CheckCircle } from 'lucide-react';
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
      case 'equipment': 
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800 border-blue-200'
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
      case 'equipment': return '🩺 Equip';
      default: return status;
    }
  };

  const colors = getStatusColor(product.status);
  
  const isEquipment = product.status === 'equipment';
  const hasPrice = product.price && product.price > 0;
  const hasStock = product.quantity && product.quantity > 0;

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
        
        {/* Status Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors.badge} whitespace-nowrap ml-2`}>
          {getStatusLabel(product.status).split(' ')[1]}
        </span>
      </div>

      {/* Supplier */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700">{product.supplier_name}</p>
        {product.manufacturer_name && (
          <p className="text-xs text-gray-600">Manufacturer: {product.manufacturer_name}</p>
        )}
      </div>

      {/* Description */}
      {product.product_description && (
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
            {product.product_description}
          </p>
        </div>
      )}

      {/* Critical Information */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white rounded-lg border border-gray-200">
            <Package className="h-3 w-3 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-600">Stock</p>
            {/* 🚀 CAMBIO CLAVE: Ahora muestra la cantidad + unidad de medida */}
            <p className={`text-sm font-bold truncate ${hasStock ? 'text-gray-900' : 'text-amber-600'}`}>
              {hasStock 
                ? `${product.quantity} ${product.unit_of_measure || 'units'}` 
                : 'On Request'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white rounded-lg border border-gray-200">
            {isEquipment ? <CheckCircle className="h-3 w-3 text-blue-600" /> : <Calendar className="h-3 w-3 text-purple-600" />}
          </div>
          <div>
            <p className="text-xs text-gray-600">{isEquipment ? 'Condition' : 'Expires'}</p>
            <p className="text-sm font-bold text-gray-900">
              {isEquipment ? 'New / Durable' : (product.expiry_date ? formatDate(product.expiry_date) : 'N/A')}
            </p>
          </div>
        </div>
      </div>

      {/* Price and Total Value */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">Unit price</p>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className={`text-lg font-bold ${hasPrice ? 'text-gray-900' : 'text-gray-400 italic text-sm'}`}>
                {hasPrice ? formatCurrency(product.price) : 'Quote Req.'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-1">Total value</p>
            <p className={`text-base font-bold ${hasPrice && hasStock ? 'text-blue-600' : 'text-gray-400'}`}>
              {hasPrice && hasStock ? formatCurrency(product.quantity * product.price) : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};