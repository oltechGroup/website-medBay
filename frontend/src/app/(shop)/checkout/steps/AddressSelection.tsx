//frontend/src/app/(shop)/checkout/steps/AddressSelection.tsx

"use client";

import { useState } from "react";
import { useAddresses, CreateAddressData } from "@/hooks/useAddresses";
import { MapPin, Plus, Loader2, Building2, Trash2 } from "lucide-react";

interface AddressSelectionProps {
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export const AddressSelection = ({ selectedAddressId, onSelect, onNext }: AddressSelectionProps) => {
  const { addresses, isLoading, addAddress, isAdding, deleteAddress, isDeleting } = useAddresses();
  const [showForm, setShowForm] = useState(false);

  // Estado del Formulario
  const [formData, setFormData] = useState<CreateAddressData>({
    address_type: 'shipping',
    street: '',
    street_number: '',
    suite_number: '',
    colony: '',
    city: '',
    state: '',
    country: 'MX', // Default México
    postal_code: '',
    between_streets: '',
    reference_point: ''
  });

  // Manejo de inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Guardar nueva dirección
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAddr = await addAddress(formData);
      setShowForm(false);
      onSelect(newAddr.id); // Seleccionar automáticamente la nueva
      // Reset form
      setFormData({ ...formData, street: '', street_number: '', postal_code: '' });
    } catch (error) {
      console.error("Error al guardar dirección", error);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800">Dirección de Envío</h2>
        <p className="text-slate-500">Selecciona dónde recibirás tus insumos médicos.</p>
      </div>

      {/* === VISTA 1: LISTA DE DIRECCIONES === */}
      {!showForm ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Botón Agregar Nueva */}
            <button 
              onClick={() => setShowForm(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group min-h-[180px]"
            >
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="text-blue-600" size={24} />
              </div>
              <span className="font-bold text-slate-600 group-hover:text-blue-700">Nueva Dirección</span>
            </button>

            {/* Lista de Direcciones Existentes */}
            {addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              
              return (
                <div 
                  key={addr.id}
                  onClick={() => onSelect(addr.id)}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[180px]
                    ${isSelected 
                      ? 'border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/10' 
                      : 'border-slate-100 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'}
                  `}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {addr.address_type === 'billing' ? 'Fiscal' : 'Envío'}
                      </div>
                      
                      {/* Botón Eliminar */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm("¿Eliminar esta dirección?")) deleteAddress(addr.id);
                        }}
                        disabled={isDeleting}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-800 text-lg mb-1">{addr.street} {addr.street_number}</h4>
                    <p className="text-sm text-slate-500 mb-1">{addr.colony}, {addr.city}</p>
                    <p className="text-sm text-slate-500 uppercase">{addr.state}, {addr.country} • CP {addr.postal_code}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1">
                      <MapPin size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-6">
            <button 
              onClick={onNext}
              disabled={!selectedAddressId}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
            >
              Continuar a Logística
            </button>
          </div>
        </div>
      ) : (
        
        /* === VISTA 2: FORMULARIO === */
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <Building2 className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold text-slate-800">Registrar nueva ubicación</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Calle *</label>
              <input required name="street" value={formData.street} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Ej. Av. Reforma" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Número Ext *</label>
                <input required name="street_number" value={formData.street_number} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="123" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Num Int</label>
                <input name="suite_number" value={formData.suite_number} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="Apt 4B" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Colonia</label>
              <input name="colony" value={formData.colony} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="Centro" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Código Postal *</label>
              <input required name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="00000" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Ciudad *</label>
              <input required name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Estado / Provincia *</label>
              <input required name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">País *</label>
              <select name="country" value={formData.country} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
                <option value="CA">Canadá</option>
                <option value="CO">Colombia</option>
                {/* Agregar más países según necesidad */}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Referencia (Opcional)</label>
              <input name="reference_point" value={formData.reference_point} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="Fachada blanca, frente al parque..." />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isAdding}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
            >
              {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Guardar Dirección
            </button>
          </div>
        </form>
      )}
    </div>
  );
};