// frontend/src/app/dashboard/quotes/QuoteResponseModal.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  X, Package, User, Calendar, DollarSign, 
  FileText, CheckCircle2, AlertTriangle, Send, Tag, Info,
  Phone, Building2, Truck, Trash2, Clock, Ban
} from "lucide-react";
import { useAdminQuotes, Quote } from "@/hooks/useAdminQuotes";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface QuoteResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
}

export default function QuoteResponseModal({ isOpen, onClose, quote }: QuoteResponseModalProps) {
  const { sendProposal, isSending, deleteQuote, isDeleting } = useAdminQuotes();

  // Estado del Formulario
  const [formData, setFormData] = useState({
    quantity_found: 0,
    unit_price: "",
    expiry_date: "",
    lot_type: "in_date", // 'in_date' | 'short_date' | 'expired'
    admin_notes: ""
  });

  const [noExpiry, setNoExpiry] = useState(false);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (quote) {
      setFormData({
        quantity_found: quote.product_request.quantity_asked, 
        unit_price: "",
        expiry_date: "",
        lot_type: "in_date",
        admin_notes: ""
      });
      setNoExpiry(false);
    }
  }, [quote, isOpen]);

  if (!isOpen || !quote) return null;

  // --- FUNCIÓN DE LIMPIEZA DE NOTAS ---
  const extractUserNote = (fullNote?: string) => {
    if (!fullNote) return null;
    const separator = "Nota del Cliente:";
    if (fullNote.includes(separator)) {
        const parts = fullNote.split(separator);
        return parts[parts.length - 1].trim(); 
    }
    if (fullNote.startsWith("[")) {
        return null; 
    }
    return fullNote;
  };

  const userRealNote = extractUserNote(quote.product_request.notes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unit_price) {
      alert("Por favor indica el precio unitario.");
      return;
    }
    if (!noExpiry && !formData.expiry_date) {
      alert("Por favor indica la fecha de caducidad o marca 'No aplica'.");
      return;
    }

    try {
      await sendProposal({
        id: quote.id,
        data: {
          ...formData,
          unit_price: parseFloat(formData.unit_price),
          expiry_date: (noExpiry ? null : formData.expiry_date) as any, 
          lot_type: formData.lot_type as any
        }
      });
      onClose(); 
    } catch (error: any) {
      console.error("Error al enviar propuesta:", error);
      alert(error.response?.data?.error || "Hubo un error al enviar la propuesta.");
    }
  };

  // ✅ NUEVO: Función para eliminar cotización
  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.")) {
        try {
            await deleteQuote(quote.id);
            onClose();
        } catch (error) {
            console.error("Error eliminando:", error);
            alert("No se pudo eliminar la cotización.");
        }
    }
  };

  // Helper para mostrar info del cliente
  const clientName = quote.user_name || quote.guest_info?.name || "Cliente Invitado";
  const clientEmail = quote.user_email || quote.guest_info?.email || "Sin email";
  const clientPhone = (quote as any).user_phone || quote.guest_info?.phone || "Sin teléfono";
  
  const context = (quote.product_request as any).quote_context;

  // --- LÓGICA DE ESTADOS (BLOQUEO) ---
  const isAccepted = quote.status === 'accepted';
  const isProposalSent = quote.status === 'proposal_sent';
  const isRejected = quote.status === 'rejected';

  // Si está aceptada o enviada, mostramos vista de solo lectura/estado
  const showReadOnlyState = isAccepted || isProposalSent;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 h-[90vh] md:h-auto max-h-[95vh]">
        
        {/* === COLUMNA IZQUIERDA: RESUMEN DE SOLICITUD === */}
        <div className="w-full md:w-2/5 bg-slate-50 p-6 md:p-8 border-r border-slate-100 flex flex-col overflow-y-auto custom-scrollbar">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText size={16}/> Solicitud Original
          </h3>

          <div className="flex-1 space-y-6">
            {/* Producto */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Producto Requerido</p>
              <p className="text-lg font-black text-slate-800 leading-tight">
                {quote.product_request.product_name}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-1 bg-white inline-block px-2 py-1 rounded border border-slate-200">
                SKU: {quote.product_request.sku}
              </p>
            </div>

            {/* Contexto Inteligente */}
            {context && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-blue-700">
                        <Info size={16}/>
                        <span className="text-xs font-black uppercase tracking-wide">Origen de la Solicitud</span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                        {context.lotNumber && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <Package size={12}/> <span className="text-[10px] font-bold uppercase">Lote Visto</span>
                                </div>
                                <span className="font-mono font-bold text-slate-800 text-sm">{context.lotNumber}</span>
                            </div>
                        )}

                        {context.supplierName && (
                             <div className="bg-white p-2 rounded border border-blue-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <Truck size={12}/> <span className="text-[10px] font-bold uppercase">Proveedor</span>
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{context.supplierName}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            {context.referencePrice && (
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">Precio Ref:</span>
                                    <span className="font-bold text-slate-700">{formatCurrency(context.referencePrice)}</span>
                                </div>
                            )}
                            {context.stockAvailable !== undefined && (
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] text-slate-500">Stock Sistema:</span>
                                    <span className="font-bold text-slate-700">{context.stockAvailable} pzas</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cantidad */}
            <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Package size={24} className="text-blue-500"/>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Cantidad Solicitada</p>
                <p className="text-2xl font-black text-slate-800">{quote.product_request.quantity_asked}</p>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-slate-400"/>
                <span className="font-bold text-slate-700 text-sm">{clientName}</span>
              </div>
              <div className="space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="opacity-70">@</span> {clientEmail}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Phone size={12} className="opacity-70"/> {clientPhone}
                  </p>
              </div>
            </div>

            {/* Notas del Cliente */}
            {userRealNote && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                  <AlertTriangle size={12}/> Nota del Cliente:
                </p>
                <p className="text-sm text-amber-900 italic whitespace-pre-wrap">"{userRealNote}"</p>
              </div>
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: FORMULARIO DE PROPUESTA === */}
        <div className="w-full md:w-3/5 p-6 md:p-8 bg-white flex flex-col overflow-y-auto custom-scrollbar relative">
          
          {/* HEADER DERECHO */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800">Generar Propuesta</h2>
            <div className="flex items-center gap-2">
                {/* ✅ BOTÓN ELIMINAR (Solo visible si no está aceptada) */}
                {!isAccepted && (
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                        title="Eliminar Cotización"
                    >
                        <Trash2 size={20}/>
                    </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X size={24} />
                </button>
            </div>
          </div>

          {/* MENSAJE DE RECHAZO (Si aplica) */}
          {isRejected && (
             <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-full">
                    <Ban size={20}/>
                </div>
                <div>
                    <p className="text-sm font-bold text-red-700">Propuesta Rechazada</p>
                    <p className="text-xs text-red-600">El cliente rechazó tu oferta anterior. Puedes enviar una nueva propuesta.</p>
                </div>
             </div>
          )}

          {/* CONTENIDO PRINCIPAL: FORMULARIO O MENSAJE DE ESTADO */}
          {showReadOnlyState ? (
             // --- VISTA DE ESTADO (BLOQUEADO) ---
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
                {isAccepted ? (
                    <>
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <CheckCircle2 size={40}/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">¡Cotización Aceptada!</h3>
                        <p className="text-slate-500 max-w-xs mb-8">El cliente ha confirmado la compra. Procede a generar la orden de venta.</p>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-200 w-full max-w-xs text-left shadow-sm">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-2">Detalles Acordados</p>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm text-slate-600">Precio:</span>
                                <span className="font-bold">{formatCurrency(quote.admin_proposal?.unit_price || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Cantidad:</span>
                                <span className="font-bold">{quote.admin_proposal?.quantity_found}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm animate-pulse">
                            <Clock size={40}/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Esperando Respuesta</h3>
                        <p className="text-slate-500 max-w-xs mb-8">Ya has enviado una propuesta. Debes esperar a que el cliente la revise.</p>
                        
                        <div className="w-full max-w-xs bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-bold text-slate-700">Propuesta Enviada</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Enviada el: {formatDate(quote.admin_proposal?.proposal_date)}
                            </p>
                        </div>
                    </>
                )}
             </div>
          ) : (
             // --- VISTA DE FORMULARIO (ACTIVO) ---
             <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
            
                <div className="grid grid-cols-2 gap-5">
                  {/* Cantidad Encontrada */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Stock Real</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number"
                        min="1"
                        required
                        value={formData.quantity_found}
                        onChange={(e) => setFormData({...formData, quantity_found: parseInt(e.target.value) || 0})}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Precio Unitario */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Precio Unitario (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-800 transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Tipo de Lote */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Condición del Lote</label>
                    <select 
                      value={formData.lot_type}
                      onChange={(e) => setFormData({...formData, lot_type: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium text-slate-700 bg-white cursor-pointer"
                    >
                      <option value="in_date">🟢 Vigente (In Date)</option>
                      <option value="short_date">🟡 Corta Caducidad</option>
                      <option value="expired">🔴 Caducado (Educativo)</option>
                    </select>
                  </div>

                  {/* Fecha de Caducidad */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-600 uppercase">Vencimiento</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={noExpiry}
                                onChange={(e) => setNoExpiry(e.target.checked)}
                                className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-500 font-medium">No aplica</span>
                        </label>
                    </div>
                    
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 size={18} ${noExpiry ? 'text-slate-200' : 'text-slate-400'}`} />
                      <input 
                        type="date"
                        required={!noExpiry}
                        disabled={noExpiry}
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium text-slate-700 transition-all
                            ${noExpiry ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}
                        `}
                      />
                    </div>
                  </div>
                </div>

                {/* Notas del Admin */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Notas Adicionales</label>
                  <textarea 
                    rows={3}
                    placeholder="Ej: El empaque tiene un ligero detalle estético..."
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                    className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm resize-none bg-white text-slate-800 placeholder-slate-400"
                  ></textarea>
                </div>

                {/* Total Estimado */}
                <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100 mt-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Propuesta</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formData.unit_price 
                      ? formatCurrency(parseFloat(formData.unit_price) * formData.quantity_found) 
                      : '$0.00'}
                  </span>
                </div>

                {/* Botón de Acción */}
                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    "Enviando..."
                  ) : (
                    <>Enviar Propuesta <Send size={18}/></>
                  )}
                </button>

             </form>
          )}
        </div>

      </div>
    </div>
  );
}