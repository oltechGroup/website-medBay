// frontend/src/components/features/inventory/LotForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Package, 
  Calendar,
  DollarSign,
  AlertCircle,
  Search
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
  products: Array<{ id: string; name: string; global_sku: string }>;
  suppliers: Array<{ id: string; name: string; country_code: string }>;
}

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

  // Cargar opciones de productos y proveedores
  useEffect(() => {
    loadFormOptions();
  }, []);

  // Cargar datos si es edición
  useEffect(() => {
    if (lot) {
      // Para edición, necesitamos cargar la relación product_supplier
      setFormData(prev => ({
        ...prev,
        lot_number: lot.lot_number,
        expiry_date: lot.expiry_date,
        quantity: lot.quantity,
        price: lot.price,
        status: lot.status,
        received_at: lot.received_at
      }));
    }
  }, [lot]);

  const loadFormOptions = async () => {
    try {
      setLoadingOptions(true);
      const response = await api.get('/inventory/form-data');
      setOptions(response.data);
    } catch (error) {
      console.error('Error loading form options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Debes seleccionar un producto';
    }

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Debes seleccionar un proveedor';
    }

    if (!formData.lot_number.trim()) {
      newErrors.lot_number = 'El número de lote es requerido';
    }

    if (!formData.expiry_date) {
      newErrors.expiry_date = 'La fecha de caducidad es requerida';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (formData.price < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Primero crear o obtener la relación producto-proveedor
      const relationResponse = await api.post('/inventory/product-suppliers', {
        product_id: formData.product_id,
        supplier_id: formData.supplier_id
      });

      const productSupplier = relationResponse.data;

      // Luego crear el lote con la relación
      const lotData: CreateLotData = {
        product_supplier_id: productSupplier.id,
        lot_number: formData.lot_number,
        expiry_date: formData.expiry_date,
        quantity: formData.quantity,
        price: formData.price,
        status: formData.status,
        received_at: formData.received_at
      };

      await onSubmit(lotData);
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
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

  if (loadingOptions) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {lot ? 'Editar Lote' : 'Crear Nuevo Lote'}
              </h2>
              <p className="text-gray-600">
                {lot ? 'Actualiza la información del lote existente' : 'Agrega un nuevo lote al inventario'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Información Básica */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información Básica
            </h3>
            
            {/* Producto */}
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                Producto *
              </label>
              <select
                id="product_id"
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.product_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un producto</option>
                {options.products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.global_sku})
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.product_id}
                </p>
              )}
            </div>

            {/* Proveedor */}
            <div>
              <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor *
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.supplier_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un proveedor</option>
                {options.suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.supplier_id}
                </p>
              )}
            </div>

            {/* Número de Lote */}
            <div>
              <label htmlFor="lot_number" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Lote *
              </label>
              <input
                type="text"
                id="lot_number"
                name="lot_number"
                value={formData.lot_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lot_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: LOTE-2024-001"
              />
              {errors.lot_number && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.lot_number}
                </p>
              )}
            </div>
          </div>

          {/* Información de Stock y Precio */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Stock y Precio
            </h3>

            {/* Fecha de Caducidad */}
            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Caducidad *
              </label>
              <input
                type="date"
                id="expiry_date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.expiry_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.expiry_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.expiry_date}
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Precio */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Precio (MXN) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.price}
                </p>
              )}
              {formData.price > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  {formatCurrency(formData.price)}
                </p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="available">🟢 En Fecha</option>
                <option value="near_expiry">🟡 Fecha Corta</option>
                <option value="expired">🔴 Caducado</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.status}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
            Información Adicional
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha de Recepción */}
            <div>
              <label htmlFor="received_at" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Recepción
              </label>
              <input
                type="date"
                id="received_at"
                name="received_at"
                value={formData.received_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen del Lote</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Valor total:</span>
              <p className="font-medium text-gray-900">
                {formatCurrency(formData.quantity * formData.price)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <p className="font-medium text-gray-900">
                {formData.status === 'available' && '🟢 En Fecha'}
                {formData.status === 'near_expiry' && '🟡 Fecha Corta'}
                {formData.status === 'expired' && '🔴 Caducado'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Guardando...' : (lot ? 'Actualizar Lote' : 'Crear Lote')}
          </button>
        </div>
      </form>
    </div>
  );
};