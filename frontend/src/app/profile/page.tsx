// frontend/src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses, Address } from "@/hooks/useAddresses";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { api } from "@/lib/api"; 
import { formatDate } from "@/lib/formatters";
import { 
  User, Phone, Mail, Building2, MapPin, FileText, 
  Edit2, AlertTriangle, CheckCircle, Clock, XCircle, 
  UploadCloud, Loader2, ShieldCheck, CreditCard, Receipt, Eye
} from "lucide-react";
import { toast } from "sonner"; 

// Importamos el modal dedicado al cliente (Visualización)
import { ClientDocumentModal } from "@/components/features/profile/ClientDocumentModal";

export default function ProfilePage() {
  // ✅ CAMBIO 1: Extraemos 'logout' para expulsar al usuario tras actualizar docs
  const { user, refreshUser, logout } = useAuth(); 
  const { billingAddresses, shippingAddresses, deleteAddress } = useAddresses();
  
  const { documents, replaceDocument, isReplacing } = useDocuments('all');
  
  // --- SEPARACIÓN DE DOCUMENTOS ---
  const legalDocs = documents.filter(d => ['license', 'business_registration'].includes(d.document_type));
  const paymentDocs = documents.filter(d => d.document_type === 'payment_evidence');

  // Estados de carga locales
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneForm, setPhoneForm] = useState("");

  // Estados para Modales
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Estado para el modal de VISUALIZACIÓN (Cliente)
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  
  // Estado para el modal de ACTUALIZACIÓN (Subida)
  const [updateDoc, setUpdateDoc] = useState<Document | null>(null);

  // Cargar teléfono inicial
  useEffect(() => {
    if (user?.phone) setPhoneForm(user.phone);
  }, [user]);

  // --- 1. ACTUALIZAR TELÉFONO ---
  const handleUpdatePhone = async () => {
    if (!phoneForm.trim()) return toast.error("El teléfono no puede estar vacío");
    
    try {
      setIsUpdatingPhone(true);
      await api.put('/users/profile', { phone: phoneForm });
      
      toast.success("Teléfono actualizado correctamente");
      setIsEditingPhone(false);
      if (refreshUser) refreshUser(); 
    } catch (error) {
      toast.error("Error al actualizar el teléfono");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  // --- HELPERS VISUALES ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full"><CheckCircle size={12}/> Verificado</span>;
      case 'uploaded': 
      case 'under_review': return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full"><Clock size={12}/> En Revisión</span>;
      case 'rejected': return <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full"><XCircle size={12}/> Rechazado</span>;
      default: return <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{status}</span>;
    }
  };

  if (!user) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 md:pt-28 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* ENCABEZADO */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
          <p className="text-slate-500 font-medium">Administra tu información personal, direcciones y documentación legal.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* === COLUMNA IZQUIERDA: IDENTIDAD Y CONTACTO === */}
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            
            {/* TARJETA DE IDENTIDAD */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              
              <div className="flex flex-col items-center text-center mb-6 relative z-10">
                <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl mb-4">
                  {user.full_name.charAt(0)}
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{user.full_name}</h2>
                <div className="mt-2">
                   <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                     {user.verification_level.replace('_', ' ')}
                   </span>
                </div>
              </div>

              <div className="space-y-5 border-t border-slate-100 pt-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Empresa / Razón Social</label>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Building2 size={16} className="text-blue-500"/>
                    {user.company_name || "No registrado"}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Correo Electrónico</label>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Mail size={16} className="text-blue-500"/>
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">RFC / Tax ID</label>
                  <div className="flex items-center gap-2 text-slate-700 font-bold font-mono bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100">
                    <CreditCard size={16} className="text-blue-500"/>
                    {user.tax_id || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* TARJETA DE CONTACTO (EDITABLE) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                  <Phone size={18} className="text-blue-600"/> Contacto
                </h3>
                {!isEditingPhone && (
                  <button onClick={() => setIsEditingPhone(true)} className="text-[10px] bg-slate-50 hover:bg-slate-100 text-blue-600 font-black px-3 py-1 rounded-full uppercase tracking-tighter transition-colors">
                    Editar
                  </button>
                )}
              </div>
              
              {isEditingPhone ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={phoneForm} 
                    onChange={(e) => setPhoneForm(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Tu número..."
                  />
                  <button 
                    onClick={handleUpdatePhone} 
                    disabled={isUpdatingPhone}
                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isUpdatingPhone ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>}
                  </button>
                  <button onClick={() => setIsEditingPhone(false)} className="text-slate-400 hover:text-red-500 p-2.5 transition-colors">
                    <XCircle size={18}/>
                  </button>
                </div>
              ) : (
                <p className="text-slate-700 font-black text-lg">{user.phone || "Sin registrar"}</p>
              )}
            </div>

          </div>

          {/* === COLUMNA CENTRAL Y DERECHA === */}
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. DIRECCIÓN FISCAL */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-widest">
                    <Building2 size={20} className="text-amber-500"/> Facturación
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Información fiscal para tus comprobantes.</p>
                </div>
                {billingAddresses.length > 0 && (
                  <button 
                    onClick={() => { setSelectedAddress(billingAddresses[0]); setIsAddressModalOpen(true); }}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition shadow-sm"
                  >
                    <Edit2 size={12}/> Modificar
                  </button>
                )}
              </div>

              {billingAddresses.length > 0 ? (
                <div className="text-sm font-bold text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                  <p className="text-lg text-slate-800 font-black mb-1">{billingAddresses[0].street} #{billingAddresses[0].street_number}</p>
                  <p>Col. {billingAddresses[0].colony}</p>
                  <p>{billingAddresses[0].city}, {billingAddresses[0].state}, {billingAddresses[0].country}</p>
                  <p className="font-mono text-xs text-blue-500 mt-4 bg-white w-fit px-3 py-1 rounded-full border border-slate-200 shadow-sm">CP: {billingAddresses[0].postal_code}</p>
                </div>
              ) : (
                <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <p className="text-slate-400 font-bold mb-4">No has configurado una dirección fiscal.</p>
                  <button className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Agregar ahora</button>
                </div>
              )}
            </div>

            {/* 2. DOCUMENTACIÓN LEGAL */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
               <h3 className="font-black text-slate-800 flex items-center gap-2 mb-8 uppercase text-sm tracking-widest">
                 <ShieldCheck size={20} className="text-blue-600"/> Documentos Legales
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {legalDocs.map((doc) => (
                   <div key={doc.id} className="border border-slate-100 rounded-3xl p-5 hover:border-blue-200 transition-all bg-slate-50/50 group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                            <FileText size={24}/>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 capitalize">
                                {doc.document_type === 'license' ? 'Cédula / Registro' : 'Acta Constitutiva'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Cargado: {formatDate(doc.created_at)}</p>
                          </div>
                        </div>
                        {getStatusBadge(doc.status)}
                     </div>
                     
                     {doc.status === 'rejected' && doc.notes && (
                       <div className="mb-4 text-[11px] font-bold bg-red-50 text-red-600 p-3 rounded-2xl border border-red-100 flex items-start gap-2">
                         <AlertTriangle size={14} className="shrink-0"/>
                         <p>"{doc.notes}"</p>
                       </div>
                     )}

                     <div className="flex gap-3 mt-4">
                       <button 
                         onClick={() => setViewDoc(doc)}
                         className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2"
                       >
                         <Eye size={14}/> Ver
                       </button>
                       <button 
                         onClick={() => setUpdateDoc(doc)}
                         className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                       >
                         Actualizar
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {legalDocs.length === 0 && (
                   <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sin documentación cargada</p>
                   </div>
                 )}
               </div>
            </div>

            {/* 3. HISTORIAL DE PAGOS */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
               <h3 className="font-black text-slate-800 flex items-center gap-2 mb-8 uppercase text-sm tracking-widest">
                 <Receipt size={20} className="text-emerald-600"/> Evidencias de Pago
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {paymentDocs.map((doc) => (
                   <div key={doc.id} className="border border-slate-100 rounded-3xl p-5 hover:border-emerald-200 transition-all bg-emerald-50/20 group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-emerald-500 group-hover:rotate-12 transition-transform">
                            <CreditCard size={24}/>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">Comprobante</p>
                            <p className="text-[10px] font-black text-emerald-600 uppercase">Orden: #{doc.reference_id?.slice(0,8) || 'N/A'}</p>
                          </div>
                        </div>
                        {getStatusBadge(doc.status)}
                     </div>

                     <div className="mt-4">
                       <button 
                         onClick={() => setViewDoc(doc)}
                         className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2"
                       >
                         <Eye size={14}/> Ver Comprobante
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {paymentDocs.length === 0 && (
                   <p className="text-slate-400 font-bold text-center py-6 col-span-full">No hay evidencias de pago registradas.</p>
                 )}
               </div>
            </div>

            {/* 4. DIRECCIONES DE ENVÍO */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-widest">
                  <MapPin size={20} className="text-slate-600"/> Mis Direcciones
                </h3>
                <button 
                  onClick={() => { setSelectedAddress(null); setIsAddressModalOpen(true); }}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl hover:bg-blue-100 transition shadow-sm"
                >
                  + Nueva Dirección
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingAddresses.map((addr) => (
                  <div key={addr.id} className="flex justify-between items-center p-5 border border-slate-100 rounded-3xl hover:bg-slate-50 transition group bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <MapPin size={18}/>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{addr.street} #{addr.street_number}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{addr.city}, {addr.state}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteAddress(addr.id)} 
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <XCircle size={20}/>
                      </button>
                  </div>
                ))}
                {shippingAddresses.length === 0 && (
                  <p className="text-slate-400 font-bold text-center py-6 col-span-full">No tienes direcciones de envío guardadas.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL: EDICIÓN DE DIRECCIÓN */}
      {isAddressModalOpen && (
        <AddressModal 
          address={selectedAddress} 
          onClose={() => setIsAddressModalOpen(false)}
        />
      )}

      {/* MODAL: VISUALIZAR DOCUMENTO */}
      {viewDoc && (
        <ClientDocumentModal 
          isOpen={!!viewDoc}
          document={viewDoc}
          onClose={() => setViewDoc(null)}
        />
      )}

      {/* MODAL: ACTUALIZAR DOCUMENTO */}
      {updateDoc && (
        <DocumentUploadModal 
          doc={updateDoc} 
          onClose={() => setUpdateDoc(null)}
          onReplace={replaceDocument}
          isSubmitting={isReplacing}
          onLogout={logout} // ✅ CAMBIO 2: Pasamos la función de logout
        />
      )}

    </div>
  );
}

/* -----------------------------------------------------------------------
    COMPONENTES INTERNOS
   -----------------------------------------------------------------------
*/

function AddressModal({ address, onClose }: { address: Address | null, onClose: () => void }) {
  const isEdit = !!address;
  const isFiscal = address?.is_fiscal;
  const { addAddress } = useAddresses(); 
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    street: address?.street || '',
    street_number: address?.street_number || '',
    colony: address?.colony || '',
    city: address?.city || '',
    state: address?.state || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'MX',
    reference_point: address?.reference_point || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/addresses/${address.id}`, formData);
        toast.success(isFiscal ? "Solicitud de cambio fiscal enviada" : "Dirección actualizada");
      } else {
        await addAddress({ ...formData, address_type: 'shipping' });
        toast.success("Dirección agregada");
      }
      onClose();
      window.location.reload(); 
    } catch (error) {
      toast.error("Error al guardar la dirección");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-8 border-b ${isFiscal ? 'bg-amber-50 border-amber-100' : 'border-slate-100'}`}>
          <h3 className={`font-black text-xl tracking-tight ${isFiscal ? 'text-amber-700' : 'text-slate-800'}`}>
            {isEdit ? (isFiscal ? 'Modificar Datos Fiscales' : 'Editar Dirección') : 'Nueva Dirección'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Calle</label>
              <input required value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Num Ext.</label>
              <input required value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">CP</label>
              <input required value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Colonia</label>
              <input required value={formData.colony} onChange={e => setFormData({...formData, colony: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Ciudad</label>
              <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Estado</label>
              <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className={`px-8 py-3 text-xs font-black uppercase tracking-widest text-white rounded-2xl transition shadow-lg flex items-center gap-3 ${isFiscal ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
              {loading && <Loader2 size={16} className="animate-spin"/>}
              {isEdit ? 'Guardar Cambios' : 'Crear Dirección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ CAMBIO 3: Definimos los tipos de las props correctamente
interface UploadModalProps { 
  doc: Document; 
  onClose: () => void;
  onReplace: (data: { id: string, formData: FormData }) => Promise<any>;
  isSubmitting: boolean;
  onLogout: () => void; // ✅ Agregamos prop para logout
}

function DocumentUploadModal({ doc, onClose, onReplace, isSubmitting, onLogout }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Por favor selecciona un archivo");
    
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("El archivo es demasiado grande (Máximo 5MB)");
    }

    const formData = new FormData();
    formData.append('documentFile', file);
    formData.append('notes', 'Actualización solicitada por usuario desde el perfil.');

    try {
      await onReplace({ id: doc.id, formData });
      
      toast.success("Documento enviado. Cerrando sesión para validación...");
      onClose();
      
      // ✅ CAMBIO 4: Esperamos un poco y forzamos el logout para aplicar la seguridad estricta
      setTimeout(() => {
        onLogout();
      }, 1500);

    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al subir el documento");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UploadCloud size={32}/>
          </div>
          <h3 className="font-black text-xl text-slate-800 tracking-tight">Actualizar {doc.document_type.replace('_', ' ')}</h3>
          <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed uppercase tracking-tighter">
            Esto reemplazará el archivo actual y pasará a revisión técnica.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ✅ NUEVO: Advertencia Visual de Seguridad */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
                Atención: Cuenta en Revisión
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                Al actualizar este documento, tu cuenta pasará a estado de <strong>validación</strong>. 
                No podrás iniciar sesión ni realizar compras hasta que un administrador verifique el nuevo archivo (aprox. 24-48 hrs).
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center hover:bg-slate-50 transition-all cursor-pointer relative group">
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="text-sm font-black text-blue-600 flex flex-col items-center gap-2">
                <FileText size={32} className="text-blue-500 animate-bounce"/> 
                <span className="truncate max-w-full px-4">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-black text-slate-500">Seleccionar archivo</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PDF, JPG o PNG (Máx 5MB)</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            <button 
              type="submit" 
              disabled={!file || isSubmitting} 
              className="flex-[1.5] py-4 text-xs font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/30 flex justify-center items-center gap-3 transition-all"
            >
               {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>}
               {isSubmitting ? 'Enviando...' : 'Confirmar y Salir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}