// frontend/src/app/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses, Address } from "@/hooks/useAddresses";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { api } from "@/lib/api"; // Usamos la instancia directa para las funciones nuevas
import { 
  User, Phone, Mail, Building2, MapPin, FileText, 
  Edit2, AlertTriangle, CheckCircle, Clock, XCircle, 
  UploadCloud, Loader2, ShieldCheck, CreditCard
} from "lucide-react";
import { toast } from "sonner"; // Asumiendo que usas sonner o react-hot-toast

export default function ProfilePage() {
  const { user, refreshUser } = useAuth(); // Asumo que tienes un refreshUser, si no, recargamos página
  const { addresses, billingAddresses, shippingAddresses, deleteAddress } = useAddresses();
  const { documents } = useDocuments('all');
  
  // Estados de carga locales para acciones específicas
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneForm, setPhoneForm] = useState("");

  // Estados para Modales
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Cargar teléfono inicial
  useEffect(() => {
    if (user?.phone) setPhoneForm(user.phone);
  }, [user]);

  // --- 1. ACTUALIZAR TELÉFONO ---
  const handleUpdatePhone = async () => {
    try {
      setIsUpdatingPhone(true);
      // Llamada directa al nuevo endpoint
      await api.put('/users/profile', { phone: phoneForm });
      
      toast.success("Teléfono actualizado correctamente");
      setIsEditingPhone(false);
      if (refreshUser) refreshUser(); // Actualizar contexto si existe la función
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
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 md:pt-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* ENCABEZADO */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Mi Perfil</h1>
          <p className="text-slate-500">Administra tu información personal, direcciones y documentación legal.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* === COLUMNA IZQUIERDA: IDENTIDAD Y CONTACTO === */}
          <div className="space-y-6">
            
            {/* TARJETA DE IDENTIDAD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-[4rem] -mr-4 -mt-4"></div>
              
              <div className="flex flex-col items-center text-center mb-6 relative z-10">
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md mb-3">
                  {user.full_name.charAt(0)}
                </div>
                <h2 className="text-lg font-bold text-slate-800">{user.full_name}</h2>
                <div className="mt-1">
                   {/* Badge de Rol Reutilizado */}
                   <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                     {user.verification_level.replace('_', ' ')}
                   </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Empresa / Razón Social</label>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Building2 size={16} className="text-slate-400"/>
                    {user.company_name || "No registrado"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Correo Electrónico</label>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Mail size={16} className="text-slate-400"/>
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">RFC / Tax ID</label>
                  <div className="flex items-center gap-2 text-slate-700 font-medium font-mono">
                    <CreditCard size={16} className="text-slate-400"/>
                    {user.tax_id || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* TARJETA DE CONTACTO (EDITABLE) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Phone size={18} className="text-blue-600"/> Teléfono de Contacto
                </h3>
                {!isEditingPhone && (
                  <button onClick={() => setIsEditingPhone(true)} className="text-xs text-blue-600 font-bold hover:underline">
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
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleUpdatePhone} 
                    disabled={isUpdatingPhone}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isUpdatingPhone ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                  </button>
                  <button onClick={() => setIsEditingPhone(false)} className="text-slate-400 hover:text-slate-600 p-2">
                    <XCircle size={16}/>
                  </button>
                </div>
              ) : (
                <p className="text-slate-600 font-medium">{user.phone || "Sin registrar"}</p>
              )}
            </div>

          </div>

          {/* === COLUMNA CENTRAL Y DERECHA: DIRECCIONES Y DOCUMENTOS === */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. DIRECCIÓN FISCAL (CRÍTICA) */}
            <div className="bg-white rounded-2xl shadow-sm border-l-4 border-amber-400 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Building2 size={18} className="text-amber-500"/> Dirección de Facturación (Fiscal)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Usada para generar tus facturas automáticamente.</p>
                </div>
                {billingAddresses.length > 0 && (
                  <button 
                    onClick={() => { setSelectedAddress(billingAddresses[0]); setIsAddressModalOpen(true); }}
                    className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
                  >
                    <Edit2 size={12}/> Modificar
                  </button>
                )}
              </div>

              {billingAddresses.length > 0 ? (
                <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-800">{billingAddresses[0].street} #{billingAddresses[0].street_number}</p>
                  <p>Col. {billingAddresses[0].colony}</p>
                  <p>{billingAddresses[0].city}, {billingAddresses[0].state}, {billingAddresses[0].country}</p>
                  <p className="font-mono text-xs text-slate-400 mt-2">CP: {billingAddresses[0].postal_code}</p>
                </div>
              ) : (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-sm">No has configurado una dirección fiscal.</p>
                  <button className="mt-2 text-blue-600 text-sm font-bold">Agregar ahora</button>
                </div>
              )}
            </div>

            {/* 2. DOCUMENTOS LEGALES */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                 <ShieldCheck size={18} className="text-blue-600"/> Documentación Legal
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {documents.map((doc) => (
                   <div key={doc.id} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-colors bg-slate-50/50">
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm text-blue-500">
                            <FileText size={20}/>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700 capitalize">{doc.document_type.replace('_', ' ')}</p>
                            <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {getStatusBadge(doc.status)}
                     </div>
                     
                     {/* Notas de rechazo si existen */}
                     {doc.status === 'rejected' && doc.notes && (
                       <div className="mb-3 text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-100">
                         <strong>Nota:</strong> {doc.notes}
                       </div>
                     )}

                     <div className="flex gap-2 mt-2">
                       <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                         Ver Archivo
                       </a>
                       <button 
                         onClick={() => { setSelectedDoc(doc); setIsDocModalOpen(true); }}
                         className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
                       >
                         Actualizar
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {documents.length === 0 && (
                   <p className="text-slate-400 text-sm col-span-2 text-center py-4">No hay documentos registrados.</p>
                 )}
               </div>
            </div>

            {/* 3. DIRECCIONES DE ENVÍO */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={18} className="text-slate-600"/> Direcciones de Envío
                </h3>
                <button 
                  onClick={() => { setSelectedAddress(null); setIsAddressModalOpen(true); }} // Null = Crear nueva
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                >
                  + Nueva Dirección
                </button>
              </div>

              <div className="space-y-3">
                {shippingAddresses.map((addr) => (
                  <div key={addr.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition group">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition">
                         <MapPin size={16}/>
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-700">{addr.street} #{addr.street_number}</p>
                         <p className="text-xs text-slate-500">{addr.city}, {addr.state}</p>
                       </div>
                     </div>
                     <button 
                       onClick={() => deleteAddress(addr.id)} 
                       className="p-2 text-slate-300 hover:text-red-500 transition"
                       title="Eliminar dirección"
                     >
                       <XCircle size={18}/>
                     </button>
                  </div>
                ))}
                {shippingAddresses.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No tienes direcciones de envío guardadas.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =======================================================
          MODAL: EDICIÓN DE DIRECCIÓN (Soporta Alerta Fiscal)
         ======================================================= */}
      {isAddressModalOpen && (
        <AddressModal 
          address={selectedAddress} 
          onClose={() => setIsAddressModalOpen(false)}
        />
      )}

      {/* =======================================================
          MODAL: ACTUALIZAR DOCUMENTO (Soporta Reemplazo)
         ======================================================= */}
      {isDocModalOpen && selectedDoc && (
        <DocumentUploadModal 
          doc={selectedDoc} 
          onClose={() => setIsDocModalOpen(false)}
        />
      )}

    </div>
  );
}

/* -----------------------------------------------------------------------
   COMPONENTES INTERNOS (MODALES) 
   Para facilitar el copy-paste, los incluyo aquí. 
   Idealmente irían en /components/features/profile/...
   -----------------------------------------------------------------------
*/

function AddressModal({ address, onClose }: { address: Address | null, onClose: () => void }) {
  const isEdit = !!address;
  const isFiscal = address?.is_fiscal;
  const { addAddress } = useAddresses(); // Asumiendo que el hook expone esto
  const [loading, setLoading] = useState(false);

  // Form state simple
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
        // ✅ USAMOS EL NUEVO ENDPOINT PUT /api/addresses/:id
        await api.put(`/addresses/${address.id}`, formData);
        toast.success(isFiscal ? "Solicitud de cambio fiscal enviada" : "Dirección actualizada");
      } else {
        // Crear nueva (shipping)
        await addAddress({ ...formData, address_type: 'shipping' });
        toast.success("Dirección agregada");
      }
      onClose();
      window.location.reload(); // Recarga rápida para ver cambios (o usar invalidateQueries)
    } catch (error) {
      toast.error("Error al guardar la dirección");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className={`p-4 border-b ${isFiscal ? 'bg-amber-50 border-amber-100' : 'border-slate-100'}`}>
          <h3 className={`font-bold text-lg ${isFiscal ? 'text-amber-700' : 'text-slate-800'}`}>
            {isEdit ? (isFiscal ? '⚠️ Modificar Dirección Fiscal' : 'Editar Dirección') : 'Nueva Dirección de Envío'}
          </h3>
          {isFiscal && (
            <p className="text-xs text-amber-600 mt-1">
              Nota: Este cambio será auditado por seguridad y notificaremos a la administración.
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Calle</label>
              <input required value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Número Ext.</label>
              <input required value={formData.street_number} onChange={e => setFormData({...formData, street_number: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Código Postal</label>
              <input required value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Colonia</label>
              <input required value={formData.colony} onChange={e => setFormData({...formData, colony: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Ciudad</label>
              <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
              <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition shadow-md flex items-center gap-2 ${isFiscal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading && <Loader2 size={16} className="animate-spin"/>}
              {isEdit ? 'Guardar Cambios' : 'Agregar Dirección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocumentUploadModal({ doc, onClose }: { doc: Document, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('documentFile', file);
    formData.append('notes', 'Actualización solicitada por usuario desde perfil.');

    try {
      // ✅ USAMOS EL NUEVO ENDPOINT PUT /api/documents/:id/replace
      await api.put(`/documents/${doc.id}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Documento enviado a revisión");
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error("Error al subir documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <UploadCloud size={24}/>
          </div>
          <h3 className="font-bold text-lg text-slate-800">Actualizar {doc.document_type.replace('_', ' ')}</h3>
          <p className="text-sm text-slate-500">Sube la nueva versión de tu documento. Esto reemplazará el archivo actual y requerirá una nueva validación.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
            <input 
              type="file" 
              accept=".pdf,.jpg,.png" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="text-sm font-bold text-blue-600 flex items-center justify-center gap-2">
                <FileText size={16}/> {file.name}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Clic para seleccionar archivo (PDF, JPG)</p>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Cancelar</button>
            <button type="submit" disabled={!file || loading} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2">
               {loading && <Loader2 size={18} className="animate-spin"/>} Subir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}