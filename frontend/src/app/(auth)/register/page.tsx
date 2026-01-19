// frontend/src/app/(auth)/register/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterFormData, registerSchema } from '@/lib/validations';
import { useRegister } from '@/hooks/useApi';
import { useCountriesBasic } from '@/hooks/useCountries';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { 
  ShieldCheck, ArrowLeft, Building2, Stethoscope, UploadCloud, FileText, X, AlertCircle, MapPin, 
  CheckCircle2, Clock, Mail
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const { data: countries = [], isLoading: isLoadingCountries } = useCountriesBasic();

  const [selectedRole, setSelectedRole] = useState<'medical_professional' | 'business_verified' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    trigger
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: '', 
      company_name: '',
      tax_id: '',
      suite_number: '',
      between_streets: '',
      reference_point: ''
    },
  });

  useEffect(() => {
    if (selectedRole) {
      setValue('verification_level', selectedRole);
      trigger('verification_level');
    }
  }, [selectedRole, setValue, trigger]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // ✅ CORRECCIÓN PRINCIPAL AQUÍ
  const onSubmit = async (data: RegisterFormData) => {
    try {
      if (files.length === 0) {
        setError('root', { type: 'manual', message: 'Es obligatorio adjuntar evidencia documental.' });
        return;
      }

      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phone', data.phone);
      
      formData.append('tax_id', data.tax_id || '');
      formData.append('verification_level', selectedRole!);
      formData.append('company_name', selectedRole === 'business_verified' ? (data.company_name || '') : '');

      formData.append('country', data.country);
      formData.append('postal_code', data.postal_code);
      formData.append('state', data.state);
      formData.append('city', data.city);
      formData.append('colony', data.colony);
      formData.append('street', data.street);
      formData.append('street_number', data.street_number);
      formData.append('suite_number', data.suite_number || '');
      formData.append('between_streets', data.between_streets || '');
      formData.append('reference_point', data.reference_point || '');

      if (files.length > 0) {
          formData.append('documentFile', files[0]); 
      }

      await registerMutation.mutateAsync(formData);
      
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error("Error submitting form:", error);

      // 1. Detectar conflicto (409) - Correo duplicado
      if (error.response && error.response.status === 409) {
        setError('email', { // <-- Seteamos el error en el input 'email'
          type: 'manual',
          message: 'Este correo electrónico ya está registrado o en revisión.'
        });
        // Opcional: Si quieres un mensaje global también, puedes descomentar esto, 
        // pero con el input rojo suele ser suficiente UX.
      } 
      // 2. Otros errores
      else {
        setError('root', {
          type: 'manual',
          message: error.response?.data?.error || 'Error al conectar con el servidor.',
        });
      }
    }
  };

  const onInvalid = (errors: any) => console.error("⛔ VALIDACIÓN FALLIDA:", errors);

  // --- VISTA 1: SELECCIÓN DE ROL ---
  if (!selectedRole) {
    // (Sin cambios en esta parte visual)
    return (
      <div className="min-h-screen w-full flex bg-slate-50 font-sans items-center justify-center p-6">
        <div className="max-w-4xl w-full animate-in fade-in zoom-in-95 duration-500">
           <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 font-bold transition-colors">
              <ArrowLeft size={20} /> Volver al inicio
           </Link>
           <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-slate-900 mb-4">¿Cómo deseas operar en MedBay?</h1>
              <p className="text-slate-500 text-lg">Selecciona tu perfil para configurar tu cuenta.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button onClick={() => setSelectedRole('medical_professional')} className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Stethoscope size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Profesional de Salud</h3>
                <p className="text-slate-500 leading-relaxed mb-6">Médicos independientes. Facturación Persona Física.</p>
                <div className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-center group-hover:bg-blue-600 group-hover:text-white transition-colors">Seleccionar</div>
              </button>
              <button onClick={() => setSelectedRole('business_verified')} className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Building2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Empresa / Clínica</h3>
                <p className="text-slate-500 leading-relaxed mb-6">Hospitales y Farmacias. Facturación Moral.</p>
                <div className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">Seleccionar</div>
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --- VISTA 2: FORMULARIO ---
  return (
    <div className="min-h-screen w-full flex bg-white font-sans relative">
      
      {/* MODAL DE ÉXITO (Overlay) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
             
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 size={40} strokeWidth={2.5} />
             </div>
             
             <h2 className="text-3xl font-black text-slate-800 mb-4">¡Solicitud Recibida!</h2>
             
             <div className="space-y-4 text-slate-600 text-sm leading-relaxed mb-8">
                 <p>
                   Gracias por registrarte en <span className="font-bold text-slate-800">MedBay</span>. Hemos recibido tu documentación exitosamente.
                 </p>
                 <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 text-left">
                    <Clock className="text-blue-600 shrink-0" size={20} />
                    <div>
                       <p className="font-bold text-blue-800 text-xs uppercase tracking-wide mb-1">Proceso de Validación</p>
                       <p className="text-blue-700">Tu cuenta pasará por una revisión regulatoria que puede tomar hasta <span className="font-bold">48 horas hábiles</span>.</p>
                    </div>
                 </div>
                 <p className="flex items-center justify-center gap-2 font-medium">
                    <Mail size={16} /> Te notificaremos vía correo electrónico.
                 </p>
             </div>

             <button 
               onClick={() => router.push('/')}
               className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2 group"
             >
               Entendido, volver al inicio 
               <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform rotate-180" />
             </button>
           </div>
        </div>
      )}

      {/* Sidebar Visual (Sin cambios) */}
      <div className="hidden lg:flex lg:w-1/3 relative overflow-hidden bg-slate-900">
        <img src="/Images/7.png" alt="Fondo" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
           <button onClick={() => { setSelectedRole(null); setFiles([]); }} className="flex items-center gap-2 text-slate-300 hover:text-white font-bold transition-colors w-fit">
              <ArrowLeft size={20} /> Cambiar Perfil
           </button>
           <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-bold mb-6 border border-white/20">
                {selectedRole === 'medical_professional' ? <Stethoscope size={16}/> : <Building2 size={16}/>}
                {selectedRole === 'medical_professional' ? 'Profesional Salud' : 'Cuenta Empresarial'}
              </div>
              <h1 className="text-4xl font-black leading-tight mb-4">Información <br/><span className="text-blue-400">Fiscal y Legal.</span></h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                La dirección ingresada será registrada como tu <strong>Domicilio Fiscal Principal</strong> y no podrá ser eliminada posteriormente, ya que está ligada a la validación de tu identidad.
              </p>
           </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-6 sm:p-12 bg-slate-50 overflow-y-auto">
        <div className="max-w-3xl w-full animate-in fade-in slide-in-from-right-8 duration-500">
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900">Registro de Cuenta</h2>
            <p className="text-slate-500 mt-2">Completa todos los campos obligatorios para la auditoría de admisión.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
            
            {/* 1. DATOS DE ACCESO */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex gap-2"><ShieldCheck size={14}/> Credenciales de Acceso</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Input label="Nombre Completo / Representante Legal" placeholder="Como aparece en documento oficial" error={errors.full_name?.message} {...register('full_name')} />
                  </div>
                  <Input label="Correo Electrónico" type="email" placeholder="contacto@dominio.com" error={errors.email?.message} {...register('email')} />
                  <Input label="Teléfono de Contacto" type="tel" placeholder="(55) 0000 0000" error={errors.phone?.message} {...register('phone')} />
                  <Input label="Contraseña" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
                  <Input label="Confirmar Contraseña" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
               </div>
            </section>

            {/* 2. DATOS FISCALES & DIRECCIÓN */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex gap-2"><MapPin size={14}/> Domicilio Fiscal y Datos Legales</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-5 border-b border-slate-100">
                  {selectedRole === 'business_verified' && (
                    <div className="md:col-span-2">
                       <Input label="Razón Social (Nombre de la Empresa)" placeholder="Ej. Hospitales Unidos S.A. de C.V." error={errors.company_name?.message} {...register('company_name')} />
                    </div>
                  )}
                  <Input label="RFC / Tax ID" placeholder="Registro Federal de Contribuyentes" error={errors.tax_id?.message} {...register('tax_id')} />
                  
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-slate-700 ml-1">País</label>
                     <select 
                       className={`w-full h-11 px-4 rounded-xl border bg-white text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${errors.country ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                       {...register('country')}
                       disabled={isLoadingCountries}
                     >
                        <option value="">Selecciona...</option>
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                     </select>
                     {errors.country && <span className="text-xs text-red-500 font-bold ml-1">{errors.country.message}</span>}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                  <div className="md:col-span-2">
                     <Input label="Código Postal" placeholder="00000" error={errors.postal_code?.message} {...register('postal_code')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="Estado / Provincia" placeholder="Estado" error={errors.state?.message} {...register('state')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="Ciudad / Municipio" placeholder="Ciudad" error={errors.city?.message} {...register('city')} />
                  </div>

                  <div className="md:col-span-3">
                     <Input label="Colonia / Barrio" placeholder="Colonia" error={errors.colony?.message} {...register('colony')} />
                  </div>
                  <div className="md:col-span-3">
                     <Input label="Calle" placeholder="Nombre de la calle" error={errors.street?.message} {...register('street')} />
                  </div>

                  <div className="md:col-span-2">
                     <Input label="No. Exterior" placeholder="123" error={errors.street_number?.message} {...register('street_number')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="No. Interior (Opcional)" placeholder="Depto 4B" error={errors.suite_number?.message} {...register('suite_number')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="Entre Calles" placeholder="Calle A y Calle B" error={errors.between_streets?.message} {...register('between_streets')} />
                  </div>

                  <div className="md:col-span-6">
                     <Input label="Referencias de ubicación" placeholder="Color de fachada, frente a parque, etc." error={errors.reference_point?.message} {...register('reference_point')} />
                  </div>
               </div>
            </section>

            {/* 3. EVIDENCIA */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex gap-2"><FileText size={14}/> Documentación</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">PDF, JPG, PNG</span>
               </div>
               
               <label className={`flex flex-col items-center justify-center w-full min-h-[128px] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${files.length > 0 ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                     <UploadCloud className={`w-8 h-8 mb-2 ${files.length > 0 ? 'text-blue-500' : 'text-slate-400'}`} />
                     <p className="text-sm text-slate-500"><span className="font-bold">Haz clic para adjuntar</span></p>
                     <p className="text-xs text-slate-400 mt-1">Cédula, Acta Constitutiva o Licencia</p>
                  </div>
                  <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
               </label>

               {files.length > 0 && (
                 <div className="mt-2 space-y-2">
                   {files.map((f, index) => (
                     <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                           <FileText size={20} className="text-blue-500" />
                           <div>
                              <p className="text-sm font-bold text-slate-700">{f.name}</p>
                              <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => removeFile(index)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"><X size={18} /></button>
                     </div>
                   ))}
                 </div>
               )}
            </section>

            {/* ✅ CORRECCIÓN VISUAL: Mensaje de error inteligente */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                 <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18}/>
                 <div>
                    {/* Si el error es del API (email duplicado), cambiamos el texto */}
                    <h4 className="text-red-800 font-bold text-sm">
                      {errors.email?.type === 'manual' 
                        ? 'Problema con el registro' 
                        : 'Faltan datos obligatorios'}
                    </h4>
                    <p className="text-xs text-red-600 mt-1">
                      {errors.email?.type === 'manual'
                        ? 'El correo ingresado ya existe. Revisa el campo para más detalles.'
                        : 'Revisa los campos en rojo (Dirección, RFC o Documentos).'}
                    </p>
                 </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl shadow-xl transition-all text-lg" loading={registerMutation.isPending}>
              Finalizar Registro
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}