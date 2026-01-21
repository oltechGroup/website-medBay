// frontend/src/components/features/users/CollaboratorsTable.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUsers, User, CreateUserDTO } from "@/hooks/useUsers";
import { 
  Plus, Search, Shield, UserCog, Copy, Check, 
  Calculator, DollarSign, X, Loader2 
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

// --- SUBCOMPONENTE: MODAL DE COMISIONES ---
const CommissionModal = ({ staff, onClose }: { staff: User; onClose: () => void }) => {
  const [percentage, setPercentage] = useState(5);
  
  // Aquí idealmente harías un fetch: /api/orders?referral_code={staff.referral_code}
  // MOCK DATA para demostración visual
  const mockOrders = [
    { id: 'ORD-001', total: 15000, date: '2024-01-15' },
    { id: 'ORD-005', total: 8500, date: '2024-01-18' },
    { id: 'ORD-012', total: 22000, date: '2024-01-20' },
  ];

  const totalSales = mockOrders.reduce((acc, curr) => acc + curr.total, 0);
  const commissionAmount = totalSales * (percentage / 100);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black">Calculadora de Comisiones</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Vendedor: {staff.full_name} ({staff.referral_code})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Porcentaje */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Porcentaje de Comisión
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="1" max="20" 
                value={percentage} 
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="flex-1 accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-black text-slate-800 w-16 text-center">
                {percentage}%
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Ventas Totales (3 órdenes)</span>
              <span className="font-bold text-slate-800">{formatCurrency(totalSales)}</span>
            </div>
            <div className="h-px bg-slate-100"></div>
            <div className="flex justify-between items-end">
              <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Comisión a Pagar</span>
              <span className="text-3xl font-black text-emerald-600">{formatCurrency(commissionAmount)}</span>
            </div>
          </div>

          <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
            <DollarSign size={20}/> Registrar Pago de Comisión
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const CollaboratorsTable = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserDTO>();
  
  const { users, isLoading, createUser, isCreating, getRoleLabel } = useUsers({ role: 'all' });
  
  // Filtrar solo Staff (Admin + Sales)
  const staff = users.filter(u => ['admin', 'sales_agent'].includes(u.verification_level));

  const onSubmit = async (data: CreateUserDTO) => {
    try {
      await createUser(data);
      setIsCreateOpen(false);
      reset();
    } catch (error) {
      alert("Error al crear usuario. Verifica el email.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <UserCog size={24}/>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Equipo Interno</h2>
            <p className="text-xs text-slate-400">Admins y Vendedores activos</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          className="bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
        >
          <Plus size={18} /> Nuevo Colaborador
        </button>
      </div>

      {/* FORMULARIO CREACIÓN (Collapsible) */}
      {isCreateOpen && (
        <div className="bg-slate-50 border border-blue-100 p-6 rounded-[2rem] animate-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Registrar Nuevo Staff
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Nombre Completo</label>
              <input {...register("full_name", { required: true })} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="Ej. Juan Pérez" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Email Corporativo</label>
              <input {...register("email", { required: true })} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="juan@medbay.com" type="email" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Contraseña</label>
              <input {...register("password", { required: true })} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" type="password" placeholder="••••••••" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Teléfono</label>
              <input {...register("phone", { required: true })} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="55 1234 5678" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Rol</label>
              <select {...register("role")} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm bg-white">
                <option value="sales_agent">Vendedor (Sales Agent)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Código Referido (Opcional)</label>
              <input {...register("referral_code")} className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm" placeholder="Auto-generado si vacío" />
            </div>

            <div className="lg:col-span-3 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-3 text-slate-500 font-bold text-sm hover:bg-white rounded-xl transition-colors">Cancelar</button>
              <button type="submit" disabled={isCreating} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2">
                {isCreating ? <Loader2 className="animate-spin" /> : <Check size={18} />} Crear Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA STAFF */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center text-blue-600"><Loader2 className="animate-spin" size={32}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-8 py-5">Colaborador</th>
                  <th className="px-6 py-5">Rol</th>
                  <th className="px-6 py-5">Código Referido</th>
                  <th className="px-6 py-5 text-right">Comisiones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((user) => {
                  const roleInfo = getRoleLabel(user.verification_level);
                  return (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{user.full_name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {user.referral_code ? (
                          <div className="flex items-center gap-2 bg-slate-100 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-mono text-xs font-bold text-slate-600">{user.referral_code}</span>
                            <button className="text-slate-400 hover:text-blue-600" title="Copiar"><Copy size={12}/></button>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {/* BOTÓN MÁGICO DE COMISIONES */}
                        {user.referral_code && (
                          <button 
                            onClick={() => setSelectedStaff(user)}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto"
                          >
                            <Calculator size={14}/> Calcular
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL COMISIONES */}
      {selectedStaff && (
        <CommissionModal 
          staff={selectedStaff} 
          onClose={() => setSelectedStaff(null)} 
        />
      )}

    </div>
  );
};