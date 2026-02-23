//frontend/src/app/(shop)/checkout/steps/AddressSelection.tsx
"use client";

import { useState } from "react";
import { useAddresses, CreateAddressData } from "@/hooks/useAddresses";
import { MapPin, Plus, Loader2, Building2, Trash2, CheckCircle2 } from "lucide-react";

interface AddressSelectionProps {
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void; // Maintained for parent prop compatibility, but not used visually
}

export const AddressSelection = ({ selectedAddressId, onSelect, onNext }: AddressSelectionProps) => {
  const { addresses, isLoading, addAddress, isAdding, deleteAddress, isDeleting } = useAddresses();
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateAddressData>({
    address_type: 'shipping',
    street: '',
    street_number: '',
    suite_number: '',
    colony: '',
    city: '',
    state: '',
    country: 'MX', // Default Mexico
    postal_code: '',
    between_streets: '',
    reference_point: ''
  });

  // Input Handling
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save new address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAddr = await addAddress(formData);
      setShowForm(false);
      onSelect(newAddr.id); // Automatically select the new one
      // Reset form
      setFormData({ ...formData, street: '', street_number: '', postal_code: '' });
    } catch (error) {
      console.error("Error saving address", error);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-6 md:mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
            Shipping Address
            {selectedAddressId && <CheckCircle2 size={20} className="text-emerald-500 animate-in zoom-in"/>}
          </h2>
          <p className="text-slate-500 text-sm md:text-base">Select where you will receive your medical supplies.</p>
        </div>
      </div>

      {/* === VIEW 1: ADDRESS LIST === */}
      {!showForm ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Add New Button */}
            <button 
              onClick={() => setShowForm(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group min-h-[140px] md:min-h-[180px] active:scale-[0.98]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="text-blue-600" size={20} />
              </div>
              <span className="font-bold text-slate-600 group-hover:text-blue-700 text-sm md:text-base">New Address</span>
            </button>

            {/* Existing Addresses List */}
            {addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              
              return (
                <div 
                  key={addr.id}
                  onClick={() => onSelect(addr.id)}
                  className={`
                    relative p-5 md:p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[140px] md:min-h-[180px] active:scale-[0.98]
                    ${isSelected 
                      ? 'border-blue-600 bg-blue-50/30 ring-2 md:ring-4 ring-blue-600/10' 
                      : 'border-slate-100 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'}
                  `}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 md:mb-3">
                      <div className={`flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {addr.address_type === 'billing' ? 'Billing' : 'Shipping'}
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm("Delete this address?")) deleteAddress(addr.id);
                        }}
                        disabled={isDeleting}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={18} className="md:w-4 md:h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-800 text-base md:text-lg mb-1 leading-tight">{addr.street} {addr.street_number}</h4>
                    <p className="text-xs md:text-sm text-slate-500 mb-0.5">{addr.colony}, {addr.city}</p>
                    <p className="text-xs md:text-sm text-slate-500 uppercase">{addr.state}, {addr.country} • ZIP {addr.postal_code}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-10 md:right-10 md:top-4 bg-blue-600 text-white rounded-full p-1 shadow-sm animate-in zoom-in">
                      <MapPin size={14} className="md:w-4 md:h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* === VIEW 2: FORM === */
        <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 mb-6 pb-4 md:pb-6 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800">Register new location</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Street *</label>
              <input required name="street" value={formData.street} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors text-base" placeholder="e.g. Main St" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Ext Number *</label>
                <input required name="street_number" value={formData.street_number} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" placeholder="123" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Unit Number</label>
                <input name="suite_number" value={formData.suite_number} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" placeholder="Apt 4B" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Neighborhood / Colony</label>
              <input name="colony" value={formData.colony} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" placeholder="Downtown" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">ZIP / Postal Code *</label>
              <input required name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" placeholder="00000" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">City *</label>
              <input required name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">State / Province *</label>
              <input required name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Country *</label>
              <select name="country" value={formData.country} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base appearance-none">
                <option value="MX">Mexico</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="CO">Colombia</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Reference (Optional)</label>
              <input name="reference_point" value={formData.reference_point} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-base" placeholder="White facade, across from the park..." />
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4 mt-8 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isAdding}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Save Address
            </button>
          </div>
        </form>
      )}
    </div>
  );
};