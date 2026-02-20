// frontend/src/components/features/users/CollaboratorsTable.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUsers, User, CreateUserDTO } from "@/hooks/useUsers";
import { api } from "@/lib/api"; // ✅ Necesitamos api para llamar a los endpoints nuevos
import { 
  Plus, Search, UserCog, Copy, Check, 
  Calculator, DollarSign, X, Loader2, AlertCircle 
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

// --- TIPOS DE COMISIÓN ---
interface CommissionSummary {
  referral_code: string;
  total_orders: string; // Postgres retorna count como string
  total_sales_amount: string; // Postgres retorna sum como string
  oldest_pending_date: string;
}

// --- HOOK LOCAL PARA GESTIONAR COMISIONES ---
const useCommissions = () => {
  const [summary, setSummary] = useState<CommissionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/commissions/summary');
      setSummary(data);
    } catch (error) {
      console.error("Error cargando comisiones:", error);
    } finally {
      setLoading(false);
    }
  };

  const payCommission = async (userId: string) => {
    try {
      const { data } = await api.post(`/users/${userId}/pay-commissions`);
      if (data.success) {
        alert(data.message); // O usar un toast mejor
        fetchSummary(); // Recargar datos para limpiar la tabla
        return true;
      }
      return false;
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar pago");
      return false;
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Helper para encontrar datos de un vendedor específico
  const getDataForUser = (referralCode?: string) => {
    if (!referralCode) return null;
    return summary.find(s => s.referral_code === referralCode) || null;
  };

  return { summary, loading, fetchSummary, payCommission, getDataForUser };
};

// --- SUBCOMPONENTE: MODAL DE COMISIONES (CONECTADO) ---
const CommissionModal = ({ 
  staff, 
  data, 
  onClose, 
  onPay 
}: { 
  staff: User; 
  data: CommissionSummary | null; 
  onClose: () => void;
  onPay: (id: string) => Promise<boolean>;
}) => {
  const [percentage, setPercentage] = useState(5);
  const [isPaying, setIsPaying] = useState(false);
  
  // Datos reales o ceros si no hay ventas pendientes
  const totalSales = data ? parseFloat(data.total_sales_amount) : 0;
  const totalOrders = data ? parseInt(data.total_orders) : 0;
  const commissionAmount = totalSales * (percentage / 100);

  const handlePay = async () => {
    if (!data) return;
    if (!confirm(`¿Confirmas que has pagado ${formatCurrency(commissionAmount)} a ${staff.full_name}? Esto marcará las ${totalOrders} órdenes como pagadas.`)) return;

    setIsPaying(true);
    const success = await onPay(staff.id);
    setIsPaying(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black">Corte de Caja</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Vendedor: {staff.full_name} ({staff.referral_code})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          
          {totalSales === 0 ? (
            <div className="text-center py-8">
              <div className="bg-slate-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Check size={32} className="text-slate-400"/>
              </div>
              <h4 className="text-slate-800 font-bold">Todo al día</h4>
              <p className="text-sm text-slate-500">No hay ventas pendientes de pago para este vendedor.</p>
            </div>
          ) : (
            <>
              {/* Info de Ventas Pendientes */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-700 uppercase">Ventas por Pagar</span>
                  <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {totalOrders} Órdenes
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(totalSales)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Acumulado desde: {formatDate(data?.oldest_pending_date)}
                </p>
              </div>

              {/* Slider de Porcentaje */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Porcentaje de Comisión
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="1" max="50" 
                    value={percentage} 
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="flex-1 accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-black text-slate-800 w-16 text-center">
                    {percentage}%
                  </div>
                </div>
              </div>

              {/* Total a Pagar */}
              <div>
                <div className="flex justify-between items-end mb-4 px-2">
                  <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Total a Transferir</span>
                  <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                    {formatCurrency(commissionAmount)}
                  </span>
                </div>

                <button 
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPaying ? <Loader2 className="animate-spin"/> : <DollarSign size={20}/>} 
                  Registrar Pago y Limpiar Deuda
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-3">
                  Al hacer clic, las {totalOrders} órdenes se marcarán como pagadas en el sistema.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const CollaboratorsTable = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  
  const { register, handleSubmit, reset } = useForm<CreateUserDTO>();
  const { users, isLoading, createUser, isCreating, getRoleLabel } = useUsers({ role: 'all' });
  
  // ✅ Usamos nuestro nuevo hook de comisiones
  const { payCommission, getDataForUser } = useCommissions();
  
  // Filtrar solo Staff
  const staff = users.filter(u => ['admin', 'sales_agent'].includes(u.verification_level));

  const onSubmit = async (data: CreateUserDTO) => {
    try {
      await createUser(data);
      setIsCreateOpen(false);
      reset();
    } catch (error) {
      alert("Error al crear usuario.");
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

      {/* FORMULARIO CREACIÓN (Sin cambios) */}
      {isCreateOpen && (
        <div className="bg-slate-50 border border-blue-100 p-6 rounded-[2rem] animate-in slide-in-from-top-4">
          {/* ... Mismo formulario que tenías antes ... */}
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
                  <th className="px-6 py-5 text-right">Corte de Caja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((user) => {
                  const roleInfo = getRoleLabel(user.verification_level);
                  
                  // ✅ Buscar datos de comisiones reales
                  const commissionData = getDataForUser(user.referral_code);
                  const hasPending = commissionData && parseFloat(commissionData.total_sales_amount) > 0;

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
                            className={`
                              relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto
                              ${hasPending 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }
                            `}
                          >
                            <Calculator size={14}/> 
                            {hasPending ? 'Pagar Comisiones' : 'Sin Pendientes'}
                            
                            {/* Puntito de notificación si hay dinero pendiente */}
                            {hasPending && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
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

      {/* MODAL COMISIONES CONECTADO */}
      {selectedStaff && (
        <CommissionModal 
          staff={selectedStaff} 
          data={getDataForUser(selectedStaff.referral_code)}
          onClose={() => setSelectedStaff(null)} 
          onPay={payCommission}
        />
      )}

    </div>
  );
};