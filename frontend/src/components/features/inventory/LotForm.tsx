// frontend/src/components/features/inventory/LotForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Package, 
  DollarSign,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import { ProductLot, CreateLotData } from '@/hooks/useInventory';
import { api } from '@/lib/api';

interface LotFormProps {
  lot?: ProductLot;
  onSubmit: (data: CreateLotData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  product_id: string;
  supplier_id: string;
  lot_number: string;
  expiry_date: string;
  quantity: number;
  price: number;
  status: 'available' | 'near_expiry' | 'expired';
  received_at: string;
}

interface FormOptions {
  products: Array<{ id: string; name: string; global_sku: string; description?: string }>;
  suppliers: Array<{ id: string; name: string; country_code: string }>;
}

// Base styles for inputs (Visible text and white background)
const inputClasses = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white border-gray-300 placeholder-gray-400";
const errorInputClasses = "border-red-300 bg-red-50 text-gray-900";

export const LotForm: React.FC<LotFormProps> = ({ 
  lot, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState<FormData>({
    product_id: '',
    supplier_id: '',
    lot_number: '',
    expiry_date: '',
    quantity: 0,
    price: 0,
    status: 'available',
    received_at: new Date().toISOString().split('T')[0]
  });

  const [options, setOptions] = useState<FormOptions>({ products: [], suppliers: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const isEditing = !!lot;

  // 1. Load options on start
  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        setLoadingOptions(true);
        try {
            const response = await api.get('/inventory/form-data');
            setOptions(response.data);
        } catch (e) {
            // Fallback: Load separately if unified endpoint fails
            const [productsRes, suppliersRes] = await Promise.all([
                api.get('/products'),
                api.get('/suppliers')
            ]);
            
            const products = productsRes.data.map((p: any) => ({
                id: p.id,
                name: p.description || p.name,
                global_sku: p.global_sku
            }));

            setOptions({
                products: products || [],
                suppliers: suppliersRes.data || []
            });
        }
      } catch (error) {
        console.error('Error loading form options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadFormOptions();
  }, []);

  // 2. Pre-fill form when options are ready AND we have a lot
  useEffect(() => {
    if (lot && !loadingOptions && options.products.length > 0) {
      fillFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lot, loadingOptions, options]);

  const fillFormData = () => {
    if (!lot) return;

    // Smart logic to find correct ID even if only name is provided
    const foundProduct = options.products.find(p => 
        p.name === lot.product_name || 
        p.global_sku === lot.product_code ||
        (p.description && p.description === lot.product_name)
    );

    const foundSupplier = options.suppliers.find(s => 
        s.name === lot.supplier_name
    );

    setFormData({
        product_id: foundProduct?.id || '',
        supplier_id: foundSupplier?.id || '',
        lot_number: lot.lot_number,
        expiry_date: lot.expiry_date ? lot.expiry_date.split('T')[0] : '',
        quantity: lot.quantity,
        price: lot.price,
        status: lot.status,
        received_at: lot.received_at ? lot.received_at.split('T')[0] : new Date().toISOString().split('T')[0]
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) newErrors.product_id = 'Select a product';
    if (!formData.supplier_id) newErrors.supplier_id = 'Select a supplier';
    if (!formData.lot_number.trim()) newErrors.lot_number = 'Lot number required';
    if (!formData.expiry_date) newErrors.expiry_date = 'Date required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Get or create the Product-Supplier relationship
      const relationResponse = await api.post('/inventory/product-suppliers', {
        product_id: formData.product_id,
        supplier_id: formData.supplier_id
      });
      
      const productSupplierId = relationResponse.data.id;

      const lotData: CreateLotData = {
        product_supplier_id: productSupplierId,
        lot_number: formData.lot_number,
        expiry_date: formData.expiry_date,
        quantity: formData.quantity,
        price: formData.price,
        status: formData.status,
        received_at: formData.received_at
      };

      await onSubmit(lotData);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'Error while saving. Please check the data.' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available': return { icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', label: 'On Date' };
      case 'near_expiry': return { icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Short Date' };
      case 'expired': return { icon: Ban, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Expired' };
      default: return { icon: Package, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(formData.status);
  const StatusIcon = statusConfig.icon;

  // Initial load loader
  if (loadingOptions) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 🎯 HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl shadow-sm">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Lot' : 'Register Entry'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isEditing ? `Editing lot: ${lot?.lot_number}` : 'Enter details for the new lot'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
        </div>
      </div>

      {/* 📝 FORM */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* COLUMN 1: Main Data */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Product Data
            </h3>
            
            {/* Product (EDITABLE) */}
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                id="product_id"
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className={`${inputClasses} ${errors.product_id ? errorInputClasses : ''}`}
              >
                <option value="">Select a product...</option>
                {options.products.map(product => (
                  <option key={product.id} value={product.id} className="text-gray-900">
                    {product.name} ({product.global_sku})
                  </option>
                ))}
              </select>
              {errors.product_id && <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>}
            </div>

            {/* Supplier (EDITABLE) */}
            <div>
              <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className={`${inputClasses} ${errors.supplier_id ? errorInputClasses : ''}`}
              >
                <option value="">Select a supplier...</option>
                {options.suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id} className="text-gray-900">
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>}
            </div>

            {/* Lot Number */}
            <div>
              <label htmlFor="lot_number" className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number (Lot SKU) *
              </label>
              <div className="relative">
                <input
                    type="text"
                    id="lot_number"
                    name="lot_number"
                    value={formData.lot_number}
                    onChange={handleChange}
                    className={`${inputClasses} pl-10 ${errors.lot_number ? errorInputClasses : ''}`}
                    placeholder="e.g.: LOT-2024-X"
                />
                <Package className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.lot_number && <p className="mt-1 text-sm text-red-600">{errors.lot_number}</p>}
            </div>
          </div>

          {/* COLUMN 2: Inventory and Dates */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Inventory Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Reception Date */}
                <div>
                    <label htmlFor="received_at" className="block text-sm font-medium text-gray-700 mb-1">
                        Reception
                    </label>
                    <input
                        type="date"
                        id="received_at"
                        name="received_at"
                        value={formData.received_at}
                        onChange={handleChange}
                        className={inputClasses}
                    />
                </div>

                {/* Expiration Date */}
                <div>
                    <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration *
                    </label>
                    <input
                        type="date"
                        id="expiry_date"
                        name="expiry_date"
                        value={formData.expiry_date}
                        onChange={handleChange}
                        className={`${inputClasses} ${errors.expiry_date ? errorInputClasses : ''}`}
                    />
                    {errors.expiry_date && <p className="mt-1 text-xs text-red-600">{errors.expiry_date}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className={`${inputClasses} ${errors.quantity ? errorInputClasses : ''}`}
                    />
                </div>

                {/* Price */}
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Cost *
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className={`${inputClasses} pl-8 ${errors.price ? errorInputClasses : ''}`}
                        />
                        <span className="absolute left-3 top-3.5 text-gray-500 font-medium">$</span>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                </label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`${inputClasses} ${statusConfig.bg} ${statusConfig.color} font-medium border-2`}
                >
                    <option value="available">🟢 On Date</option>
                    <option value="near_expiry">🟡 Short Date</option>
                    <option value="expired">🔴 Expired</option>
                </select>
            </div>
          </div>
        </div>

        {/* 📊 FINAL SUMMARY */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${statusConfig.bg}`}>
                    <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total Lot Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(formData.quantity * formData.price)}
                    </p>
                </div>
            </div>
            <div className="text-right hidden md:block">
                <p className="text-xs text-gray-400">Internal ID</p>
                <p className="text-sm font-mono text-gray-600">{lot ? lot.id.slice(0, 8) : 'N/A'}</p>
            </div>
        </div>

        {/* GENERAL ERRORS */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errors.submit}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all shadow-md disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Register Lot')}
          </button>
        </div>
      </form>
    </div>
  );
};