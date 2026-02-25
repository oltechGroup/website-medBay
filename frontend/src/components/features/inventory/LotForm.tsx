// frontend/src/components/features/inventory/LotForm.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Save, 
  X, 
  Package, 
  DollarSign,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Ban,
  Search,
  Building2,
  ChevronDown
} from 'lucide-react';
import { ProductLot, CreateLotData, useInventory } from '@/hooks/useInventory';

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

export const LotForm: React.FC<LotFormProps> = ({ 
  lot, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const { getFormData } = useInventory();
  
  // 1. Estados del Formulario
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

  // 2. Estados para el Buscador Dinámico
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const isEditing = !!lot;

  // 3. Carga Inicial y Buscador (Debounced)
  const fetchOptions = useCallback(async (search: string = '') => {
    setIsSearching(true);
    try {
      const data = await getFormData(search);
      setProducts(data.products || []);
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Error fetching options:', err);
    } finally {
      setIsSearching(false);
      setInitialLoading(false);
    }
  }, [getFormData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOptions(productSearch);
    }, 400); // 400ms de espera antes de buscar en el servidor
    return () => clearTimeout(timer);
  }, [productSearch, fetchOptions]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Pre-llenado en modo Edición
  useEffect(() => {
    if (lot && initialLoading) {
      setFormData({
        product_id: lot.product_id || '',
        supplier_id: lot.supplier_id || '',
        lot_number: lot.lot_number,
        expiry_date: lot.expiry_date ? lot.expiry_date.split('T')[0] : '',
        quantity: lot.quantity,
        price: lot.price,
        status: lot.status,
        received_at: lot.received_at ? lot.received_at.split('T')[0] : new Date().toISOString().split('T')[0]
      });
      // Si estamos editando, ponemos el nombre del producto actual en el buscador
      setProductSearch(lot.product_name);
    }
  }, [lot, initialLoading]);

  // 5. Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectProduct = (product: any) => {
    setFormData(prev => ({ ...prev, product_id: product.id }));
    setProductSearch(product.name);
    setShowProductDropdown(false);
    if (errors.product_id) setErrors(prev => ({ ...prev, product_id: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.product_id) newErrors.product_id = 'Search and select a product';
    if (!formData.supplier_id) newErrors.supplier_id = 'Required';
    if (!formData.lot_number.trim()) newErrors.lot_number = 'Required';
    if (!formData.expiry_date) newErrors.expiry_date = 'Required';
    if (formData.quantity <= 0) newErrors.quantity = 'Must be > 0';
    if (formData.price < 0) newErrors.price = 'Cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSubmit({
        product_supplier_id: '', // Se calculará en el hook usando product_id + supplier_id
        ...formData
      } as any);
    } catch (error) {
      setErrors({ submit: 'The relationship Product-Supplier failed. Check connection.' });
    }
  };

  const statusConfig = {
    available: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'On Date' },
    near_expiry: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Short Date' },
    expired: { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' }
  }[formData.status];

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-gray-400">Initializing form engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-xl">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {isEditing ? 'Modify Batch' : 'New Stock Entry'}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inventory Logistics</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-gray-200 p-8 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* LEFT: Product Selection */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Origin & Product
            </h3>

            {/* BUSCADOR INTELIGENTE DE PRODUCTOS */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Search Product *</label>
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Type name or SKU..."
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none transition-all font-bold text-sm ${errors.product_id ? 'border-red-200 ring-red-50' : 'border-transparent focus:bg-white focus:border-blue-500'}`}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {isSearching && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
              </div>

              {/* DROPDOWN DE RESULTADOS */}
              {showProductDropdown && (products.length > 0 || isSearching) && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-2">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Searching catalog...</div>
                  ) : (
                    products.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className={`w-full text-left p-3 rounded-xl hover:bg-blue-50 transition-colors flex flex-col ${formData.product_id === p.id ? 'bg-blue-50 border border-blue-100' : ''}`}
                      >
                        <span className="text-sm font-black text-gray-900">{p.name}</span>
                        <span className="text-[10px] font-bold text-gray-400">SKU: {p.global_sku}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {errors.product_id && <p className="mt-2 text-[10px] font-black text-red-500 uppercase ml-1 tracking-tighter">{errors.product_id}</p>}
            </div>

            {/* SELECTOR DE PROVEEDOR */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Supplier Source *</label>
              <div className="relative">
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-10 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm appearance-none ${errors.supplier_id ? 'border-red-200' : ''}`}
                >
                  <option value="">Select partner...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Lot / Batch SKU *</label>
              <input
                type="text"
                name="lot_number"
                value={formData.lot_number}
                onChange={handleChange}
                placeholder="e.g. LOT-500-2024"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
              />
            </div>
          </div>

          {/* RIGHT: Inventory Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
              Stock & Expiry
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Reception</label>
                <input type="date" name="received_at" value={formData.received_at} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Expiry *</label>
                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Units *</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-black text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Unit Cost *</label>
                <div className="relative">
                  <input type="number" name="price" step="0.01" value={formData.price} onChange={handleChange} className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-black text-sm" />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Batch Health Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-5 py-3.5 rounded-2xl border-2 outline-none font-black text-xs uppercase tracking-widest transition-all appearance-none ${statusConfig.bg} ${statusConfig.color} border-transparent focus:border-blue-500`}
              >
                <option value="available">🟢 Optimal - In Date</option>
                <option value="near_expiry">🟡 Warning - Short Date</option>
                <option value="expired">🔴 Alert - Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between shadow-2xl shadow-slate-200">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <statusConfig.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Estimated Asset Value</p>
              <p className="text-3xl font-black text-white tracking-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.quantity * formData.price)}
              </p>
            </div>
          </div>
          <div className="text-right">
             <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                {statusConfig.label}
             </span>
          </div>
        </div>

        {errors.submit && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
            <AlertCircle className="h-5 w-5" />
            {errors.submit}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 stroke-[3]" />}
            {isEditing ? 'Update Assets' : 'Commit Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};