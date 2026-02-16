// frontend/src/components/features/users/ClientsTable.tsx
"use client";

import { useState } from "react";
import { useUsers, AccountStatus } from "@/hooks/useUsers";
import { useDocuments, Document as DocumentData } from "@/hooks/useDocuments"; 
import { 
  Search, Filter, CheckCircle2, XCircle, FileText, 
  Loader2, ShieldAlert, UserCog
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

// Importamos los Modales
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { UserDetailsModal } from "@/components/features/users/UserDetailsModal";
import { DocumentViewerModal } from "@/components/features/documents/DocumentViewerModal";

export const ClientsTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');

  // --- ESTADOS PARA MODALES ---
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'approve' | 'reject'; userId: string } | null>(null);
  const [detailsModalId, setDetailsModalId] = useState<string | null>(null);
  const [docModalData, setDocModalData] = useState<DocumentData | null>(null);

  // --- HOOKS ---
  const { users, isLoading, updateStatus, isUpdating, getRoleLabel, getStatusLabel } = useUsers({
    page,
    search,
    limit: 10,
    role: 'all'
  });

  // Traemos TODAS las licencias (admin) para cruzar datos con los usuarios
  const { documents, updateStatus: updateDocStatus, isUpdating: isDocUpdating } = useDocuments('license', 'admin');

  // Filtramos para no mostrar Staff en esta tabla (solo clientes)
  const clients = users.filter(u => !['admin', 'sales_agent'].includes(u.verification_level));

  // --- HANDLERS ---

  // 1. Buscar y abrir documento de registro
  const handleOpenDoc = (userDoc: DocumentData | undefined) => {
    if (userDoc) {
      setDocModalData(userDoc);
    } else {
      alert("⚠️ Este usuario no tiene documentos de registro cargados o aprobados aún.");
    }
  };

  // 2. Ejecutar Acción de Estado de CUENTA (Confirmada)
  const handleStatusAction = async () => {
    if (!confirmModal) return;
    // Aquí reside el poder: Solo esta función cambia el estado del USUARIO a 'active' o 'rejected'
    const newStatus = confirmModal.type === 'approve' ? 'active' : 'rejected';
    await updateStatus({ id: confirmModal.userId, status: newStatus });
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar cliente, empresa o email..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="bg-white border border-slate-200 text-slate-600 text-sm font-bold py-2.5 px-4 rounded-xl outline-none focus:border-blue-500 cursor-pointer"
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

      {/* TABLA DE CLIENTES */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center text-blue-600"><Loader2 className="animate-spin" size={32}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-8 py-5">Usuario / Empresa</th>
                  <th className="px-6 py-5">Nivel</th>
                  <th className="px-6 py-5">Estado Cuenta</th>
                  <th className="px-6 py-5">Documentación</th>
                  <th className="px-6 py-5 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map((client) => {
                  const roleInfo = getRoleLabel(client.verification_level);
                  const statusInfo = getStatusLabel(client.account_status);
                  
                  // Encontramos el documento de licencia de este usuario para mostrar su estado
                  const userDoc = documents.find(d => d.owner_id === client.id && d.document_type === 'license');

                  return (
                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* 1. Datos Usuario */}
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

                      {/* 2. Nivel */}
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* 3. Estado Cuenta */}
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusInfo.color}`}>
                          {client.account_status === 'active' ? <CheckCircle2 size={12}/> : 
                           client.account_status === 'pending' ? <ShieldAlert size={12}/> : <XCircle size={12}/>}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* 4. Estado Documento (Visualización Rápida) */}
                      <td className="px-6 py-5">
                         {userDoc ? (
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleOpenDoc(userDoc)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all shadow-sm
                                    ${userDoc.status === 'verified' 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                                      : userDoc.status === 'rejected'
                                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                        : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 animate-pulse'
                                    }
                                  `}
                                >
                                  <FileText size={14} />
                                  <span className="text-[10px] font-bold uppercase">
                                    {userDoc.status === 'verified' ? 'Aprobado' : 
                                     userDoc.status === 'rejected' ? 'Rechazado' : 'Revisar'}
                                  </span>
                                </button>
                            </div>
                         ) : (
                            <span className="text-xs text-slate-400 italic">Sin archivo</span>
                         )}
                         <div className="text-[10px] text-slate-400 font-mono mt-1 ml-1">
                           {formatDate(client.created_at)}
                         </div>
                      </td>

                      {/* 5. Acciones Finales (Aprobar Cuenta) */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Ver Perfil 360 (Siempre disponible si no es pendiente o si queremos ver detalles) */}
                          <button 
                            onClick={() => setDetailsModalId(client.id)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Perfil Completo y Órdenes"
                          >
                            <UserCog size={18} />
                          </button>

                          {/* Acciones de Aprobación de CUENTA (Solo si está pendiente) */}
                          {client.account_status === 'pending' && (
                            <>
                              <div className="w-px h-6 bg-slate-200 mx-1"></div>
                              <button 
                                onClick={() => setConfirmModal({ isOpen: true, type: 'approve', userId: client.id })}
                                disabled={isUpdating}
                                className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Aprobar Acceso a Cuenta"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => setConfirmModal({ isOpen: true, type: 'reject', userId: client.id })}
                                disabled={isUpdating}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rechazar y Eliminar"
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
        
        {/* PAGINACIÓN */}
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
             disabled={isLoading || clients.length < 10}
             className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-50"
           >
             Siguiente
           </button>
        </div>
      </div>

      {/* === MODALES === */}

      {/* 1. Confirmación (Acción Final de Cuenta) */}
      <ConfirmationModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleStatusAction}
        title={confirmModal?.type === 'approve' ? "¿Aprobar Cliente?" : "¿Rechazar Solicitud?"}
        description={confirmModal?.type === 'approve' 
          ? "El usuario tendrá acceso inmediato a compras y precios mayoristas." 
          : "El usuario será notificado y su cuenta quedará inhabilitada."}
        type={confirmModal?.type === 'approve' ? 'success' : 'danger'}
        confirmText={confirmModal?.type === 'approve' ? 'Aprobar Acceso' : 'Rechazar'}
        isLoading={isUpdating}
      />

      {/* 2. Detalles 360 */}
      {detailsModalId && (
        <UserDetailsModal 
          userId={detailsModalId} 
          onClose={() => setDetailsModalId(null)} 
        />
      )}

      {/* 3. Visor de Documentos (Solo modifica estado del documento) */}
      {docModalData && (
        <DocumentViewerModal
          isOpen={!!docModalData}
          onClose={() => setDocModalData(null)}
          document={docModalData}
          onStatusChange={async (id, status, notes) => {
             // Solo actualizamos el documento, no la cuenta
             await updateDocStatus({ id, status, notes });
             setDocModalData(null);
          }}
          isUpdating={isDocUpdating}
        />
      )}

    </div>
  );
};