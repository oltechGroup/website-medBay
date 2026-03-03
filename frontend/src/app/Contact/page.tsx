// frontend/src/app/Contact/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  Clock, 
  ShieldCheck,
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Facebook,
  Instagram,
  MessageCircle // Usaremos este para WhatsApp
} from "lucide-react";

export default function Contact() {
  // --- STATES (Intactos) ---
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: ""
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // --- HANDLERS (Intactos) ---
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
      const response = await fetch("https://api.medbaysupply.com/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ nombre: "", email: "", asunto: "" , mensaje: "" }); 
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        throw new Error(data.error || "Error sending the message");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("There was a problem connecting to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* ======= HERO SECTION ======= */}
      <section className="relative pt-32 pb-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/Images/10.jpg" 
            alt="Medical Support" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-50"></div>
        </div>

        <div className="relative z-10 w-[90%] max-w-[1000px] mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold mb-6 backdrop-blur-sm">
             <MessageSquare size={14} /> PRIORITY SUPPORT CHANNEL
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            We are here to <span className="text-blue-400 italic">help you</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
            Questions about a lot or a bulk order? Our team of experts is ready to advise you.
          </p>
        </div>
      </section>

      {/* ======= CONTACT CONTENT ======= */}
      <section className="relative z-20 -mt-12 pb-32 w-[90%] max-w-[1200px] mx-auto px-0 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            
            {/* Card 1: Contact Info */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
              <h2 className="text-2xl font-black mb-8 text-slate-800">Contact Information</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Corporate Email</p>
                    <p className="text-lg font-bold text-slate-700 break-all leading-tight">medbay.info02@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Line</p>
                    <p className="text-lg font-bold text-slate-700">+1 (787) 466-2212</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Headquarters</p>
                    <p className="text-lg font-bold text-slate-700 leading-snug">EDOMEX, Mexico</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <Clock className="text-blue-500 flex-shrink-0" size={24} />
                <p className="text-sm text-slate-600 font-medium">Support: Mon - Fri, 9:00 AM to 6:00 PM</p>
              </div>
            </div>

            {/* Card 2: Social Media & WhatsApp */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
              <h2 className="text-2xl font-black mb-6 text-slate-800">Quick Connect</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* WHATSAPP - Botón Principal */}
                <a 
                  href="https://wa.me/17874662212" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 rounded-3xl bg-green-50 border border-green-100 hover:bg-green-500 hover:text-white transition-all group"
                >
                  <div className="w-12 h-12 bg-white text-green-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <MessageCircle size={28} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-green-700 group-hover:text-green-50 uppercase tracking-[0.2em]">Live Chat</span>
                    <span className="text-lg font-black">WhatsApp Business</span>
                  </div>
                </a>

                {/* FB e IG en Fila */}
                <div className="grid grid-cols-2 gap-4">
                    <a 
                    href="https://www.facebook.com/profile.php?id=61586918317156" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                    >
                    <Facebook className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" size={24} />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-700 uppercase tracking-[0.2em]">Facebook</span>
                    </a>
                    
                    <a 
                    href="https://www.instagram.com/medbay_supply/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-pink-50 hover:border-pink-200 transition-all group"
                    >
                    <Instagram className="text-slate-400 group-hover:text-pink-600 mb-2 transition-colors" size={24} />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-pink-700 uppercase tracking-[0.2em]">Instagram</span>
                    </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: FORM (Intacto) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">Send us a message</h2>
                <p className="text-slate-500 mb-8 md:mb-10 font-medium text-sm md:text-base">You will receive a response in less than 24 business hours.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Name</label>
                      <input 
                        type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                        placeholder="Your full name" 
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                        required disabled={status === 'loading'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                      <input 
                        type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="example@medbay.com" 
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                        required disabled={status === 'loading'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                    <input 
                      type="text" name="asunto" value={formData.asunto} onChange={handleChange}
                      placeholder="e.g. Inquiry about bulk lots" 
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                      required disabled={status === 'loading'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                    <textarea 
                      name="mensaje" value={formData.mensaje} onChange={handleChange}
                      placeholder="Tell us how we can help you..." rows={5}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none" 
                      required disabled={status === 'loading'}
                    ></textarea>
                  </div>

                  {status === 'success' && (
                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 border border-green-200 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 size={20} />
                      <p className="text-sm font-bold">Message sent!</p>
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
                    className={`w-full group bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 
                      ${status === 'loading' ? 'opacity-80 cursor-wait' : 'hover:bg-blue-700 active:scale-95'}
                      ${status === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}
                    `}
                  >
                    {status === 'loading' ? (
                      <><Loader2 size={24} className="animate-spin" /> Sending...</>
                    ) : status === 'success' ? (
                      <>Sent Successfully</>
                    ) : (
                      <>Send Message <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                    )}
                  </button>
                </form>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none">
                <img src="/icons/logomed.png" alt="" className="w-48 md:w-64" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= TRUST SECTION ======= */}
      <section className="py-12 md:py-20 bg-slate-100">
        <div className="w-[90%] max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 opacity-50 grayscale">
            <div className="flex items-center gap-2 font-bold text-slate-400 text-sm md:text-base">
                <ShieldCheck size={28} className="md:w-8 md:h-8" />
                <span>ENCRYPTED DATA</span>
            </div>
            <div className="h-px w-20 bg-slate-300 hidden md:block"></div>
            <img src="/icons/logomednegro.png" alt="MedBay" className="h-6 md:h-8" />
            <div className="h-px w-20 bg-slate-300 hidden md:block"></div>
            <span className="font-bold text-slate-400 text-sm md:text-base">MEDBAY SECURITY</span>
        </div>
      </section>
    </div>
  );
}