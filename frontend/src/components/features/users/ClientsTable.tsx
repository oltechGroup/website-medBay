// frontend/src/components/features/users/ClientsTable.tsx
"use client";

import { useState } from "react";
import { useUsers, User, AccountStatus } from "@/hooks/useUsers";
import { 
  Search, Filter, CheckCircle2, XCircle, FileText, 
  MoreHorizontal, ShoppingCart, Loader2, ShieldAlert
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

export const ClientsTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');

  // Usamos el hook pero "filtramos" visualmente o pedimos backend soporte array de roles
  // Por simplicidad, pedimos 'all' y filtramos en UI o backend mejorado
  const { users, isLoading, updateStatus, isUpdating, getRoleLabel, getStatusLabel, pagination } = useUsers({
    page,
    search,
    limit: 10,
    role: 'all' // Traemos todos y filtramos los que NO son staff en el render
  });

  // Filtrar solo clientes (excluir admin/sales)
  const clients = users.filter(u => !['admin', 'sales_agent'].includes(u.verification_level));

  const handleStatusChange = async (userId: string, newStatus: AccountStatus) => {
    if (confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) {
      await updateStatus({ id: userId, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o empresa..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="bg-white border border-slate-200 text-slate-600 text-sm font-bold py-2.5 px-4 rounded-xl outline-none focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="active">Activos</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center text-blue-600"><Loader2 className="animate-spin" size={32}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-8 py-5">Usuario / Empresa</th>
                  <th className="px-6 py-5">Rol Solicitado</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5">Registro</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map((client) => {
                  const roleInfo = getRoleLabel(client.verification_level);
                  const statusInfo = getStatusLabel(client.account_status);

                  return (
                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{client.full_name}</span>
                          <span className="text-xs text-slate-500">{client.email}</span>
                          {client.company_name && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mt-1">
                              {client.company_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusInfo.color}`}>
                          {client.account_status === 'active' ? <CheckCircle2 size={12}/> : 
                           client.account_status === 'pending' ? <ShieldAlert size={12}/> : <XCircle size={12}/>}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {formatDate(client.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Ver Documentos (Simulado enlace) */}
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Documentación"
                          >
                            <FileText size={18} />
                          </button>

                          {/* Botón Acciones Rápidas (Aprobar/Rechazar) */}
                          {client.account_status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(client.id, 'active')}
                                disabled={isUpdating}
                                className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Aprobar Cuenta"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleStatusChange(client.id, 'rejected')}
                                disabled={isUpdating}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rechazar"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* PAGINACIÓN SIMPLE */}
        <div className="p-4 border-t border-slate-100 flex justify-center gap-4">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1 || isLoading}
             className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-50"
           >
             Anterior
           </button>
           <span className="text-xs font-bold text-slate-300">Página {page}</span>
           <button 
             onClick={() => setPage(p => p + 1)}
             disabled={isLoading || clients.length < 10} // Lógica simple
             className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-50"
           >
             Siguiente
           </button>
        </div>
      </div>
    </div>
  );
};