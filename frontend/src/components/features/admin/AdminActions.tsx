// frontend/src/components/features/admin/AdminActions.tsx

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Edit3, FileText, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import EmailPreviewModal from './EmailPreviewModal';

interface AdminActionsProps {
  userId: string;
  userEmail: string;
  userName: string;
  onActionComplete: () => void;
}

export default function AdminActions({ userId, userEmail, userName, onActionComplete }: AdminActionsProps) {
  // Estado de la interfaz
  const [mode, setMode] = useState<'idle' | 'approve_setup' | 'reject_setup'>('idle');
  const [inputType, setInputType] = useState<'template' | 'custom'>('template');
  
  // Datos del formulario
  const [reason, setReason] = useState('Documentación incompleta'); // Para template
  const [customMessage, setCustomMessage] = useState(''); // Para custom

  // Estado del Modal de Confirmación
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  // --- PREPARAR DATOS PARA PREVIEW ---
  const getPreviewData = () => {
    const isApprove = mode === 'approve_setup';
    const finalMessage = inputType === 'custom' 
      ? customMessage 
      : (isApprove 
          ? "Nos complace informarte que tu documentación ha sido validada y tu cuenta empresarial ha sido AUTORIZADA." 
          : `Lamentablemente tu solicitud no ha sido aprobada. Motivo: ${reason}`);

    return {
      type: isApprove ? 'approve' as const : 'reject' as const,
      subject: isApprove ? "🎉 ¡Tu cuenta en MedBay ha sido Aprobada!" : "Actualización sobre tu solicitud en MedBay",
      body: finalMessage
    };
  };

  // --- EJECUTAR ACCIÓN FINAL (LLAMADA API) ---
  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    const { type, body } = getPreviewData();
    
    // Si es template y reject, mandamos 'reason'. Si es custom, mandamos el mensaje completo.
    // Para simplificar, en el backend rejectUser acepta 'reason'.
    // Si es custom, usaremos 'reason' para pasar todo el mensaje.
    
    const payload = {
      userId,
      userEmail,
      userName,
      reason: body // En el backend, esto se inserta en el correo
    };

    try {
      const endpoint = type === 'approve' ? '/admin/users/approve' : '/admin/users/reject';
      await api.post(endpoint, payload);
      
      setResult('success');
      setShowPreview(false);
      setTimeout(onActionComplete, 2500); // Dar tiempo para leer el éxito
    } catch (error) {
      console.error(error);
      setResult('error');
      setIsSubmitting(false);
      setShowPreview(false);
    }
  };

  // --- RENDER: MENSAJE DE ÉXITO ---
  if (result === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
           <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">¡Proceso Completado!</h3>
        <p className="text-green-700 font-medium">
          El usuario ha sido notificado y la base de datos actualizada.
        </p>
      </div>
    );
  }

  // --- RENDER: SELECTOR INICIAL (BOTONES GIGANTES) ---
  if (mode === 'idle') {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlertTriangle size={14} /> Zona de Decisión
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { setMode('reject_setup'); setInputType('template'); }}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <XCircle size={32} className="text-slate-300 group-hover:text-red-500 transition-colors" />
            Rechazar Solicitud
          </button>

          <button
            onClick={() => { setMode('approve_setup'); setInputType('template'); }}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 hover:scale-[1.02] shadow-xl transition-all"
          >
            <CheckCircle size={32} />
            Autorizar Cuenta
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: CONFIGURACIÓN DE RESPUESTA (APPROVE O REJECT) ---
  const isApprove = mode === 'approve_setup';
  
  return (
    <div className={`rounded-2xl p-6 border mt-6 animate-in slide-in-from-bottom-4 ${isApprove ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
      
      {/* Header del Panel */}
      <div className="flex items-center justify-between mb-6">
        <h4 className={`text-sm font-black uppercase tracking-wide flex items-center gap-2 ${isApprove ? 'text-blue-700' : 'text-red-700'}`}>
           {isApprove ? <CheckCircle size={18}/> : <XCircle size={18}/>}
           {isApprove ? 'Configurar Aprobación' : 'Configurar Rechazo'}
        </h4>
        <button onClick={() => setMode('idle')} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">
          Cancelar
        </button>
      </div>

      {/* Tabs: Predeterminado vs Manual */}
      <div className="flex bg-white/50 p-1 rounded-xl mb-6 border border-black/5">
        <button 
          onClick={() => setInputType('template')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2
            ${inputType === 'template' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <FileText size={14}/> Predeterminado
        </button>
        <button 
          onClick={() => setInputType('custom')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2
            ${inputType === 'custom' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Edit3 size={14}/> Mensaje Manual
        </button>
      </div>

      {/* Contenido del Formulario */}
      <div className="mb-6">
        {inputType === 'template' ? (
           isApprove ? (
             <div className="bg-white p-4 rounded-xl border border-blue-200 text-sm text-slate-600 italic">
               "Nos complace informarte que tu documentación ha sido validada y tu cuenta empresarial ha sido AUTORIZADA..."
             </div>
           ) : (
             <div>
               <label className="block text-xs font-bold text-red-700 mb-2 uppercase">Selecciona el motivo:</label>
               <select 
                 className="w-full p-3 rounded-xl border border-red-200 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
               >
                  <option value="Documentación incompleta">Documentación incompleta</option>
                  <option value="Documento ilegible o borroso">Documento ilegible o borroso</option>
                  <option value="La cédula profesional no coincide con el solicitante">Datos no coinciden</option>
                  <option value="No cubrimos su zona geográfica">Sin cobertura</option>
               </select>
             </div>
           )
        ) : (
           <div>
             <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Escribe el mensaje personalizado:</label>
             <textarea 
               className="w-full p-4 rounded-xl border border-slate-300 bg-white h-32 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
               placeholder={isApprove ? "Escribe un mensaje de bienvenida especial..." : "Explica detalladamente por qué se rechaza..."}
               value={customMessage}
               onChange={(e) => setCustomMessage(e.target.value)}
             ></textarea>
           </div>
        )}
      </div>

      {/* Botón de Continuar */}
      <button
        onClick={() => setShowPreview(true)}
        disabled={inputType === 'custom' && !customMessage.trim()}
        className={`w-full py-4 rounded-xl font-black text-white shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100
          ${isApprove ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
      >
        Continuar a Vista Previa <ArrowRight size={18}/>
      </button>

      {/* MODAL DE PREVIEW */}
      <EmailPreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmAction}
        isLoading={isSubmitting}
        type={getPreviewData().type}
        recipientName={userName}
        recipientEmail={userEmail}
        subject={getPreviewData().subject}
        messageBody={getPreviewData().body}
      />

    </div>
  );
}