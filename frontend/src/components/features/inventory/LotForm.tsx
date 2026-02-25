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
  ChevronDown,
  Layers,
  Tag // ✅ IMPORTACIÓN AGREGADA
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

  // 3. Carga de Opciones con Debounce
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
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch, fetchOptions]);

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
    if (!formData.product_id) newErrors.product_id = 'Product selection required';
    if (!formData.supplier_id) newErrors.supplier_id = 'Supplier required';
    if (!formData.lot_number.trim()) newErrors.lot_number = 'Lot SKU required';
    if (!formData.expiry_date) newErrors.expiry_date = 'Required';
    if (formData.quantity <= 0) newErrors.quantity = 'Invalid qty';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSubmit(formData as any);
    } catch (error) {
      setErrors({ submit: 'Operational Error: Failed to commit entry.' });
    }
  };

  const statusConfig = {
    available: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'OPTIMAL' },
    near_expiry: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'WARNING' },
    expired: { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', label: 'EXPIRED' }
  }[formData.status];

  // Estilo común para inputs - CERO TRANSPARENCIAS
  const inputBaseClass = "w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-slate-900 placeholder-slate-400 shadow-sm";

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Form Engine</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-12">
      {/* 🚀 HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {isEditing ? 'Modify Inventory' : 'Batch Registration'}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Asset Control & Logistics</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
          <X className="h-6 w-6 text-slate-400 stroke-[3]" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* LEFT: Origin & Identity */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Product Identity</h3>
            </div>

            {/* BUSCADOR INTELIGENTE */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Search Catalog Item *</label>
              <div className="relative group">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Type name or SKU..."
                  className={`${inputBaseClass} pl-14 ${errors.product_id ? 'border-red-200 bg-red-50' : ''}`}
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                {isSearching && <RefreshCw className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
              </div>

              {showProductDropdown && (products.length > 0 || isSearching) && (
                <div className="absolute z-50 w-full mt-3 bg-white border-2 border-slate-100 rounded-[2rem] shadow-2xl max-h-72 overflow-y-auto p-3 animate-in slide-in-from-top-2">
                  {isSearching ? (
                    <div className="p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Filtering Assets...</div>
                  ) : (
                    products.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className={`w-full text-left p-4 rounded-2xl hover:bg-blue-50 transition-all flex flex-col mb-1 ${formData.product_id === p.id ? 'bg-blue-50 border border-blue-100' : ''}`}
                      >
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">SKU: {p.global_sku}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {errors.product_id && <p className="mt-2 text-[10px] font-black text-red-500 uppercase ml-1 tracking-widest">{errors.product_id}</p>}
            </div>

            {/* PROVEEDOR */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Supplier Partner *</label>
              <div className="relative">
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className={`${inputBaseClass} pl-14 pr-12 appearance-none cursor-pointer ${errors.supplier_id ? 'border-red-200 bg-red-50' : ''}`}
                >
                  <option value="" className="font-bold">Select source...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* LOT NUMBER */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Batch SKU / Lot Number *</label>
              <div className="relative group">
                <input
                  type="text"
                  name="lot_number"
                  value={formData.lot_number}
                  onChange={handleChange}
                  placeholder="e.g. BATCH-A900"
                  className={`${inputBaseClass} pl-14`}
                />
                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* RIGHT: Logistics & Valuation */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Timeline & Stock</h3>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Received</label>
                <input type="date" name="received_at" value={formData.received_at} onChange={handleChange} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Expiration *</label>
                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className={`${inputBaseClass} ${errors.expiry_date ? 'border-red-200' : ''}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Units *</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Unit Cost *</label>
                <div className="relative">
                  <input type="number" name="price" step="0.01" value={formData.price} onChange={handleChange} className={`${inputBaseClass} pl-10`} />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Health Status</label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`${inputBaseClass} pl-14 appearance-none font-black text-[10px] uppercase tracking-[0.2em] ${statusConfig.bg} ${statusConfig.color}`}
                >
                  <option value="available">🟢 Optimal - In Date</option>
                  <option value="near_expiry">🟡 Warning - Short Date</option>
                  <option value="expired">🔴 Alert - Expired</option>
                </select>
                <statusConfig.icon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5" />
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-40" />
              </div>
            </div>
          </div>
        </div>

        {/* 💰 VALUATION SUMMARY CARD - BLACK EDITION */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 flex items-center justify-between shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <DollarSign className="h-10 w-10 text-white stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Projected Asset Value</p>
              <p className="text-4xl font-black text-white tracking-tighter mt-1">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.quantity * formData.price)}
              </p>
            </div>
          </div>
          <div className="text-right relative z-10">
             <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/20`}>
                <statusConfig.icon className="h-3 w-3" />
                {statusConfig.label}
             </div>
          </div>
        </div>

        {errors.submit && (
          <div className="p-5 bg-red-50 text-red-700 rounded-2xl border-2 border-red-100 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <AlertCircle className="h-6 w-6" />
            {errors.submit}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-6 pt-6 border-t-2 border-slate-50">
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
            disabled={loading}
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 stroke-[3]" />}
            {isEditing ? 'Apply Changes' : 'Commit Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};