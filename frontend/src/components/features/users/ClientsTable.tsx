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

// Modal Imports
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { UserDetailsModal } from "@/components/features/users/UserDetailsModal";
import { DocumentViewerModal } from "@/components/features/documents/DocumentViewerModal";

export const ClientsTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');

  // --- MODAL STATES ---
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

  // Fetch ALL licenses (admin) to cross-reference data with users
  const { documents, updateStatus: updateDocStatus, isUpdating: isDocUpdating } = useDocuments('license', 'admin');

  // ✅ MODIFICADO: Excluimos también a 'supplier' de esta tabla (solo se mostrarán clientes reales)
  const clients = users.filter(u => !['admin', 'sales_agent', 'supplier'].includes(u.verification_level));

  // --- HANDLERS ---

  // 1. Find and open registration document
  const handleOpenDoc = (userDoc: DocumentData | undefined) => {
    if (userDoc) {
      setDocModalData(userDoc);
    } else {
      alert("⚠️ This user has no registration documents uploaded or approved yet.");
    }
  };

  // 2. Execute ACCOUNT Status Action (Confirmed)
  const handleStatusAction = async () => {
    if (!confirmModal) return;
    // Account status change to 'active' or 'rejected'
    const newStatus = confirmModal.type === 'approve' ? 'active' : 'rejected';
    await updateStatus({ id: confirmModal.userId, status: newStatus });
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6">
      
      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search client, company or email..." 
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
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* CLIENTS TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center text-blue-600"><Loader2 className="animate-spin" size={32}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-8 py-5">User / Company</th>
                  <th className="px-6 py-5">Level</th>
                  <th className="px-6 py-5">Account Status</th>
                  <th className="px-6 py-5">Documentation</th>
                  <th className="px-6 py-5 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map((client) => {
                  const roleInfo = getRoleLabel(client.verification_level);
                  const statusInfo = getStatusLabel(client.account_status);
                  
                  // Find this user's license document to show its status
                  const userDoc = documents.find(d => d.owner_id === client.id && d.document_type === 'license');

                  return (
                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* 1. User Data */}
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

                      {/* 2. Level */}
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* 3. Account Status */}
                      <td className="px-6 py-5">
                        <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusInfo.color}`}>
                          {client.account_status === 'active' ? <CheckCircle2 size={12}/> : 
                           client.account_status === 'pending' ? <ShieldAlert size={12}/> : <XCircle size={12}/>}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* 4. Document Status (Quick View) */}
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
                                    {userDoc.status === 'verified' ? 'Approved' : 
                                     userDoc.status === 'rejected' ? 'Rejected' : 'Review'}
                                  </span>
                                </button>
                            </div>
                         ) : (
                            <span className="text-xs text-slate-400 italic">No file</span>
                         )}
                         <div className="text-[10px] text-slate-400 font-mono mt-1 ml-1">
                           {formatDate(client.created_at)}
                         </div>
                      </td>

                      {/* 5. Final Actions (Approve Account) */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* View 360 Profile */}
                          <button 
                            onClick={() => setDetailsModalId(client.id)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Full Profile and Orders"
                          >
                            <UserCog size={18} />
                          </button>

                          {/* ACCOUNT Approval Actions (Only if pending) */}
                          {client.account_status === 'pending' && (
                            <>
                              <div className="w-px h-6 bg-slate-200 mx-1"></div>
                              <button 
                                onClick={() => setConfirmModal({ isOpen: true, type: 'approve', userId: client.id })}
                                disabled={isUpdating}
                                className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve Account Access"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => setConfirmModal({ isOpen: true, type: 'reject', userId: client.id })}
                                disabled={isUpdating}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject and Delete"
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
        
        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-100 flex justify-center gap-4">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1 || isLoading}
             className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-50"
           >
             Previous
           </button>
           <span className="text-xs font-bold text-slate-300">Page {page}</span>
           <button 
             onClick={() => setPage(p => p + 1)}
             disabled={isLoading || clients.length < 10}
             className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-50"
           >
             Next
           </button>
        </div>
      </div>

      {/* === MODALS === */}

      {/* 1. Confirmation (Final Account Action) */}
      <ConfirmationModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleStatusAction}
        title={confirmModal?.type === 'approve' ? "Approve Client?" : "Reject Request?"}
        description={confirmModal?.type === 'approve' 
          ? "The user will have immediate access to purchases and wholesale prices." 
          : "The user will be notified and their account will be disabled."}
        type={confirmModal?.type === 'approve' ? 'success' : 'danger'}
        confirmText={confirmModal?.type === 'approve' ? 'Approve Access' : 'Reject'}
        isLoading={isUpdating}
      />

      {/* 2. 360 Details */}
      {detailsModalId && (
        <UserDetailsModal 
          userId={detailsModalId} 
          onClose={() => setDetailsModalId(null)} 
        />
      )}

      {/* 3. Document Viewer (Only modifies document status) */}
      {docModalData && (
        <DocumentViewerModal
          isOpen={!!docModalData}
          onClose={() => setDocModalData(null)}
          document={docModalData}
          onStatusChange={async (id, status, notes) => {
              // We only update the document, not the account
              await updateDocStatus({ id, status, notes });
              setDocModalData(null);
          }}
          isUpdating={isDocUpdating}
        />
      )}

    </div>
  );
};