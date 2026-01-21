// frontend/src/app/dashboard/documents/page.tsx
"use client";

import { useState } from "react";
// Importamos el tipo como 'DocumentData' para evitar conflictos con 'document' del navegador
import { useDocuments, Document as DocumentData, DocStatus } from "@/hooks/useDocuments";
import { DocumentViewerModal } from "@/components/features/documents/DocumentViewerModal";
import { FileText, Search, Calendar, User, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function DocumentsPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);

  // Hook principal
  const { documents, isLoading, updateStatus, isUpdating } = useDocuments('all');

  // Filtrado en cliente (rápido y eficiente para listas administrativas)
  const filteredDocs = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    const searchLower = searchTerm.toLowerCase();
    
    // Búsqueda robusta en varios campos
    const matchesSearch = 
      doc.id.toLowerCase().includes(searchLower) ||
      doc.user_name?.toLowerCase().includes(searchLower) ||
      doc.user_email?.toLowerCase().includes(searchLower);
    
    return matchesType && matchesSearch;
  });

  // Handler para cuando se aprueba/rechaza desde el modal
  const handleStatusChange = async (id: string, status: DocStatus, notes?: string) => {
    await updateStatus({ id, status, notes });
    
    // Si la acción fue exitosa y era el documento abierto, lo cerramos
    // (Opcional: podrías dejarlo abierto para ver el cambio de estado)
    if (selectedDoc?.id === id && status === 'verified') {
      setSelectedDoc(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Centro de Documentación</h1>
            <p className="text-slate-500 font-medium">Revisión de evidencias de pago, licencias y registros.</p>
          </div>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Tabs Tipo */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'payment_evidence', label: 'Pagos' },
              { id: 'license', label: 'Registros' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  filterType === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80 px-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por usuario o ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* GRID DE DOCUMENTOS */}
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FileText size={40}/>
            </div>
            <p className="text-slate-500 font-bold">No se encontraron documentos pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredDocs.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="group bg-white rounded-[2rem] p-1 border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Encabezado Card */}
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${
                      doc.document_type === 'payment_evidence' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {doc.document_type === 'payment_evidence' ? <CreditCard size={24}/> : <ShieldCheck size={24}/>}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      doc.status === 'verified' ? 'bg-green-100 text-green-700' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700 animate-pulse'
                    }`}>
                      {doc.status === 'under_review' ? 'Pendiente' : doc.status}
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">
                      {doc.document_type === 'payment_evidence' ? 'Comprobante de Pago' : 'Licencia Sanitaria'}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <User size={14}/> 
                      <span className="truncate">{doc.user_name || doc.user_email || 'Usuario Desconocido'}</span>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12}/> {formatDate(doc.created_at)}
                    </span>
                    <span className="group-hover:text-blue-600 transition-colors">Ver Detalles →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL VISUALIZADOR */}
        {selectedDoc && (
          <DocumentViewerModal 
            isOpen={!!selectedDoc}
            onClose={() => setSelectedDoc(null)}
            document={selectedDoc}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdating}
          />
        )}

      </div>
    </div>
  );
}