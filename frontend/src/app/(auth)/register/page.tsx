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
  CheckCircle2, Clock, Mail, Truck // ✅ Agregado Truck para el icono de proveedor
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const { data: countries = [], isLoading: isLoadingCountries } = useCountriesBasic();

  // ✅ MODIFICADO: Agregamos 'supplier' a los roles permitidos en el estado
  const [selectedRole, setSelectedRole] = useState<'medical_professional' | 'business_verified' | 'supplier' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // NEW STATE: To handle general server errors without mixing with React Hook Form
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    trigger,
    watch 
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

  // LÓGICA DE FORTALEZA DE CONTRASEÑA
  const passwordValue = watch('password') || '';
  
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', bg: 'bg-slate-200', text: 'text-slate-500' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', bg: 'bg-red-500', text: 'text-red-600' };
    if (score === 2) return { score: 2, label: 'Fair', bg: 'bg-orange-500', text: 'text-orange-600' };
    if (score === 3) return { score: 3, label: 'Good', bg: 'bg-yellow-500', text: 'text-yellow-600' };
    return { score: 4, label: 'Strong', bg: 'bg-green-500', text: 'text-green-600' };
  };

  const strength = getPasswordStrength(passwordValue);

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
      setServerError(null); 
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // MAIN HANDLER
  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null); 
    
    try {
      if (files.length === 0) {
        setServerError('It is mandatory to attach documentary evidence (ID or Deed).');
        return;
      }

      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phone', data.phone);
      
      formData.append('tax_id', data.tax_id || '');
      formData.append('verification_level', selectedRole!);
      
      // ✅ MODIFICADO: Tanto business_verified como supplier necesitan company_name
      const isBusinessRole = selectedRole === 'business_verified' || selectedRole === 'supplier';
      formData.append('company_name', isBusinessRole ? (data.company_name || '') : '');

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

      if (error.response && error.response.status === 409) {
        setError('email', { 
          type: 'manual',
          message: 'This email address is already registered or under review.'
        });
      } 
      else {
        const backendMsg = error.response?.data?.error || error.response?.data?.details || 'Internal error processing your registration. Please try again.';
        setServerError(backendMsg);
      }
    }
  };

  const onInvalid = (errors: any) => {
    console.error("⛔ VALIDATION FAILED:", errors);
    setServerError(null); 
  };

  // --- VIEW 1: ROLE SELECTION ---
  if (!selectedRole) {
    return (
      <div className="min-h-screen w-full flex bg-slate-50 font-sans items-center justify-center p-6">
        <div className="max-w-6xl w-full animate-in fade-in zoom-in-95 duration-500">
           <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 font-bold transition-colors">
              <ArrowLeft size={20} /> Back to home
           </Link>
           <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-slate-900 mb-4">How do you want to operate on MedBay?</h1>
              <p className="text-slate-500 text-lg">Select your profile to set up your account.</p>
           </div>
           
           {/* ✅ MODIFICADO: Grid a 3 columnas y tarjeta de Proveedor agregada */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <button onClick={() => setSelectedRole('medical_professional')} className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left flex flex-col h-full">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Stethoscope size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Health Professional</h3>
                <p className="text-slate-500 leading-relaxed mb-8 flex-grow">Independent doctors and specialists. Individual Billing.</p>
                <div className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-center group-hover:bg-blue-600 group-hover:text-white transition-colors mt-auto">Select</div>
              </button>

              <button onClick={() => setSelectedRole('business_verified')} className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left flex flex-col h-full">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Building2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Company / Clinic</h3>
                <p className="text-slate-500 leading-relaxed mb-8 flex-grow">Hospitals, Clinics and Pharmacies. Corporate Billing.</p>
                <div className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-center group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-auto">Select</div>
              </button>

              {/* TERCERA TARJETA: PROVEEDOR */}
              <button onClick={() => setSelectedRole('supplier')} className="group relative bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-left flex flex-col h-full">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Truck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">B2B Supplier</h3>
                <p className="text-slate-500 leading-relaxed mb-8 flex-grow">Manufacturers and Wholesale Distributors. Sell your catalog through MedBay.</p>
                <div className="w-full py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mt-auto">Select</div>
              </button>

           </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: FORM ---
  return (
    <div className="min-h-screen w-full flex bg-white font-sans relative">
      
      {/* SUCCESS MODAL (Overlay) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
             
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 size={40} strokeWidth={2.5} />
             </div>
             
             <h2 className="text-3xl font-black text-slate-800 mb-4">Request Received!</h2>
             
             <div className="space-y-4 text-slate-600 text-sm leading-relaxed mb-8">
                 <p>
                   Thank you for registering at <span className="font-bold text-slate-800">MedBay</span>. We have successfully received your documentation.
                 </p>
                 <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 text-left">
                    <Clock className="text-blue-600 shrink-0" size={20} />
                    <div>
                       <p className="font-bold text-blue-800 text-xs uppercase tracking-wide mb-1">Validation Process</p>
                       <p className="text-blue-700">Your account will go through a regulatory review that can take up to <span className="font-bold">48 business hours</span>.</p>
                    </div>
                 </div>
                 <p className="flex items-center justify-center gap-2 font-medium">
                    <Mail size={16} /> We will notify you via email.
                 </p>
             </div>

             <button 
               onClick={() => router.push('/')}
               className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2 group"
             >
               Got it, back to home 
               <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform rotate-180" />
             </button>
           </div>
        </div>
      )}

      {/* Visual Sidebar */}
      <div className="hidden lg:flex lg:w-1/3 relative overflow-hidden bg-slate-900">
        <img src="/Images/7.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
           <button onClick={() => { setSelectedRole(null); setFiles([]); setServerError(null); }} className="flex items-center gap-2 text-slate-300 hover:text-white font-bold transition-colors w-fit">
              <ArrowLeft size={20} /> Change Profile
           </button>
           <div>
             {/* ✅ MODIFICADO: Títulos e iconos dinámicos según el rol seleccionado */}
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-bold mb-6 border border-white/20">
               {selectedRole === 'medical_professional' && <Stethoscope size={16}/>}
               {selectedRole === 'business_verified' && <Building2 size={16}/>}
               {selectedRole === 'supplier' && <Truck size={16}/>}
               
               {selectedRole === 'medical_professional' ? 'Health Professional' : 
                selectedRole === 'business_verified' ? 'Business Account' : 'B2B Supplier'}
             </div>
             <h1 className="text-4xl font-black leading-tight mb-4">Tax and <br/><span className="text-blue-400">Legal Information.</span></h1>
             <p className="text-slate-400 text-sm leading-relaxed">
               The entered address will be registered as your <strong>Primary Tax Address</strong> and cannot be deleted later, as it is linked to the validation of your identity.
             </p>
           </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-6 sm:p-12 bg-slate-50 overflow-y-auto">
        <div className="max-w-3xl w-full animate-in fade-in slide-in-from-right-8 duration-500">
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900">Account Registration</h2>
            <p className="text-slate-500 mt-2">Complete all mandatory fields for the admission audit.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
            
            {/* 1. ACCESS DATA */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex gap-2"><ShieldCheck size={14}/> Access Credentials</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Input label="Full Name / Legal Representative" placeholder="As it appears on official document" error={errors.full_name?.message} {...register('full_name')} />
                  </div>
                  <Input label="Email Address" type="email" placeholder="contact@domain.com" error={errors.email?.message} {...register('email')} />
                  <Input label="Contact Phone" type="tel" placeholder="(55) 0000 0000" error={errors.phone?.message} {...register('phone')} />
                  
                  <div className="space-y-1">
                    <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
                    {passwordValue.length > 0 && (
                      <div className="mt-1 animate-in fade-in duration-300">
                        <div className="flex gap-1 h-1 w-full rounded-full overflow-hidden">
                          {[1, 2, 3, 4].map((level) => (
                            <div 
                              key={level} 
                              className={`h-full flex-1 transition-colors duration-300 ${level <= strength.score ? strength.bg : 'bg-slate-200'}`} 
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-1.5 px-0.5">
                          <span className="text-[10px] text-slate-400">
                            Min 8 chars, A-Z, 0-9 & Symbol
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.text}`}>
                            {strength.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
               </div>
            </section>

            {/* 2. TAX DATA & ADDRESS */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex gap-2"><MapPin size={14}/> Tax Address and Legal Data</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-5 border-b border-slate-100">
                  {/* ✅ MODIFICADO: Mostrar campo de Empresa si es B2B o Proveedor */}
                  {(selectedRole === 'business_verified' || selectedRole === 'supplier') && (
                    <div className="md:col-span-2">
                       <Input label="Business Name (Company Name)" placeholder="e.g. United Hospitals Inc." error={errors.company_name?.message} {...register('company_name')} />
                    </div>
                  )}
                  <Input label="RFC / Tax ID" placeholder="Tax Registration Number" error={errors.tax_id?.message} {...register('tax_id')} />
                  
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-slate-700 ml-1">Country</label>
                     <select 
                       className={`w-full h-11 px-4 rounded-xl border bg-white text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${errors.country ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                       {...register('country')}
                       disabled={isLoadingCountries}
                     >
                        <option value="">Select...</option>
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                     </select>
                     {errors.country && <span className="text-xs text-red-500 font-bold ml-1">{errors.country.message}</span>}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                  <div className="md:col-span-2">
                     <Input label="ZIP / Postal Code" placeholder="00000" error={errors.postal_code?.message} {...register('postal_code')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="State / Province" placeholder="State" error={errors.state?.message} {...register('state')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="City / Municipality" placeholder="City" error={errors.city?.message} {...register('city')} />
                  </div>

                  <div className="md:col-span-3">
                     <Input label="Neighborhood / Colony" placeholder="Colony" error={errors.colony?.message} {...register('colony')} />
                  </div>
                  <div className="md:col-span-3">
                     <Input label="Street" placeholder="Street name" error={errors.street?.message} {...register('street')} />
                  </div>

                  <div className="md:col-span-2">
                     <Input label="Street Number" placeholder="123" error={errors.street_number?.message} {...register('street_number')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="Suite / Unit (Optional)" placeholder="Apt 4B" error={errors.suite_number?.message} {...register('suite_number')} />
                  </div>
                  <div className="md:col-span-2">
                     <Input label="Cross Streets" placeholder="Street A and Street B" error={errors.between_streets?.message} {...register('between_streets')} />
                  </div>

                  <div className="md:col-span-6">
                     <Input label="Location References" placeholder="Building color, across from park, etc." error={errors.reference_point?.message} {...register('reference_point')} />
                  </div>
               </div>
            </section>

            {/* 3. EVIDENCE */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex gap-2"><FileText size={14}/> Documentation</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">PDF, JPG, PNG</span>
               </div>
               
               <label className={`flex flex-col items-center justify-center w-full min-h-[128px] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${files.length > 0 ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                     <UploadCloud className={`w-8 h-8 mb-2 ${files.length > 0 ? 'text-blue-500' : 'text-slate-400'}`} />
                     <p className="text-sm text-slate-500"><span className="font-bold">Click to attach</span></p>
                     <p className="text-xs text-slate-400 mt-1">ID, Deed, or License</p>
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

            {/* ERROR MESSAGE */}
            {(Object.keys(errors).length > 0 || serverError) && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                 <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18}/>
                 <div>
                    <h4 className="text-red-800 font-bold text-sm">
                      {serverError 
                        ? 'Attention' 
                        : (errors.email?.type === 'manual' ? 'Registration Issue' : 'Missing Mandatory Data')
                      }
                    </h4>
                    <p className="text-xs text-red-600 mt-1">
                      {serverError 
                        ? serverError 
                        : (errors.email?.type === 'manual'
                            ? 'The entered email already exists. Check the field for more details.'
                            : 'Please review the fields in red (Address, Tax ID, or Documents).')
                      }
                    </p>
                 </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl shadow-xl transition-all text-lg" loading={registerMutation.isPending}>
              Complete Registration
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}