// frontend/src/app/Contact/page.tsx
"use client"; // Necesario para hooks de estado

import React, { useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  ChevronRight, 
  MessageSquare, 
  Clock, 
  ShieldCheck,
  Loader2, // Icono de carga
  CheckCircle2, // Icono de éxito
  AlertCircle // Icono de error
} from "lucide-react";

export default function Contacto() {
  // --- ESTADOS ---
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: ""
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // --- MANEJADORES ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      // Ajusta la URL si tu backend está en otro puerto o dominio
      const response = await fetch("http://localhost:3001/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ nombre: "", email: "", asunto: "", mensaje: "" }); // Limpiar form
        
        // Regresar el botón a la normalidad después de 5 segundos
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        throw new Error(data.error || "Error al enviar el mensaje");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Hubo un problema al conectar con el servidor. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* ======= HEADER ======= */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-100">
        <div className="w-[90%] max-w-[1400px] mx-auto py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/icons/logomed.png" alt="Logo" className="w-10 h-10 rounded-lg transition-transform group-hover:scale-105" />
            <div className="flex text-2xl font-bold leading-none tracking-tight">
              <span className="text-blue-500">Med</span><span className="text-slate-700">Bay</span>
            </div>
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <Link href="/Characteristics" className="hover:text-blue-600 transition-colors">Características</Link>
            <Link href="/About" className="hover:text-blue-600 transition-colors">Nosotros</Link>
            <Link href="/products" className="hover:text-blue-600 transition-colors">Catálogo</Link>
            <Link href="/Contact" className="text-blue-600 transition-colors font-bold">Contacto</Link>
          </nav>

          <div className="flex items-center gap-3">
             <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Ingresar</Link>
             <Link href="/register" className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg">
               Registro
             </Link>
          </div>
        </div>
      </header>

      {/* ======= HERO SECTION ======= */}
      <section className="relative pt-24 pb-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/10.jpg" 
            alt="Medical Support" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
        </div>

        <div className="relative z-10 w-[90%] max-w-[1000px] mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold mb-6">
             <MessageSquare size={14} /> CANAL DE ATENCIÓN PRIORITARIA
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-none">
            Estamos para <span className="text-blue-400 italic">ayudarte</span>
          </h1>
          <p className="text-slate-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
            ¿Dudas sobre un lote o una orden masiva? Nuestro equipo de expertos está listo para asesorarte.
          </p>
        </div>
      </section>

      {/* ======= CONTACT CONTENT (Layout Dividido) ======= */}
      <section className="relative z-20 -mt-12 pb-32 w-[90%] max-w-[1200px] mx-auto px-4 md:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LADO IZQUIERDO: INFO DE CONTACTO */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
              <h2 className="text-2xl font-black mb-8 text-slate-800">Información de Contacto</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Corporativo</p>
                    <p className="text-lg font-bold text-slate-700">medbay.info02@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Línea de Ventas</p>
                    <p className="text-lg font-bold text-slate-700">+52 (55) 8800-MEDS</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Oficinas Centrales</p>
                    <p className="text-lg font-bold text-slate-700 leading-snug">CDMX, México - Distrito Tecnológico</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <Clock className="text-blue-500" size={24} />
                <p className="text-sm text-slate-600 font-medium">
                  Atención B2B: Lun - Vie, 9:00 AM a 6:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: FORMULARIO PREMIUM */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-slate-800 mb-2">Envíanos un mensaje</h2>
                <p className="text-slate-500 mb-10 font-medium">Recibirás una respuesta en menos de 24 horas hábiles.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Nombre</label>
                      <input 
                        type="text" 
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre completo" 
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                        required 
                        disabled={status === 'loading'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ejemplo@medbay.com" 
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                        required 
                        disabled={status === 'loading'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Asunto</label>
                    <input 
                      type="text" 
                      name="asunto"
                      value={formData.asunto}
                      onChange={handleChange}
                      placeholder="Ej. Consulta sobre lotes masivos" 
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                      required 
                      disabled={status === 'loading'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Mensaje</label>
                    <textarea 
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      placeholder="Cuéntanos cómo podemos ayudarte..." 
                      rows={5}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none" 
                      required 
                      disabled={status === 'loading'}
                    ></textarea>
                  </div>

                  {/* Feedback Messages */}
                  {status === 'success' && (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 border border-green-200 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 size={20} />
                      <p className="text-sm font-bold">¡Mensaje enviado! Nos pondremos en contacto pronto.</p>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 border border-red-200 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle size={20} />
                      <p className="text-sm font-bold">{errorMessage}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === 'loading' || status === 'success'}
                    className={`w-full group bg-blue-600 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 
                      ${status === 'loading' ? 'opacity-80 cursor-wait' : 'hover:bg-blue-700 active:scale-95'}
                      ${status === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}
                    `}
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        Enviando...
                      </>
                    ) : status === 'success' ? (
                      <>Enviado con Éxito</>
                    ) : (
                      <>
                        Enviar Mensaje
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Marca de agua sutil en el fondo del form */}
              <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none">
                <img src="/icons/logomed.png" alt="" className="w-64" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= SECCIÓN FINAL: CONFIANZA ======= */}
      <section className="py-20 bg-slate-100">
        <div className="w-[90%] max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-center gap-12 opacity-50 grayscale">
            <div className="flex items-center gap-2 font-bold text-slate-400">
                <ShieldCheck size={32} />
                <span>DATOS ENCRIPTADOS</span>
            </div>
            <div className="h-px w-20 bg-slate-300 hidden md:block"></div>
            <img src="/icons/logomednegro.png" alt="MedBay" className="h-8" />
            <div className="h-px w-20 bg-slate-300 hidden md:block"></div>
            <span className="font-bold text-slate-400">SOPORTE NIVEL 3</span>
        </div>
      </section>

      {/* ======= FOOTER ROBUSTO ======= */}
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
            <div className="space-y-6">
              <img src="/icons/logocompletoblanco.png" alt="MedBay Full Logo" className="w-52 mx-auto md:mx-0 opacity-90" />
              <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0 font-medium italic">
                Socio estratégico líder en la distribución y gestión inteligente de dispositivos médicos B2B.
              </p>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50 text-center md:text-left">Plataforma</h4>
              <ul className="space-y-4 text-sm font-semibold">
                <li><Link href="/About" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Nosotros</Link></li>
                <li><Link href="/Characteristics" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Características</Link></li>
                <li><Link href="/products" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Catálogo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50 text-center md:text-left">Soporte</h4>
              <ul className="space-y-4 text-sm font-semibold">
                <li><Link href="/Contact" className="text-blue-500 flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Contacto</Link></li>
                <li><a href="#" className="hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors"><ChevronRight size={14}/> Devoluciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50 text-center md:text-left">Legal</h4>
              <ul className="space-y-4 text-sm font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">Aviso de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos Comerciales</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
              © 2025 MedBay Inc. Global Access to Medical Devices.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}