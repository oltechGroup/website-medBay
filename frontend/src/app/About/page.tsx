//frontend/src/app/About/page.tsx

import Link from "next/link";
import { 
  Target, 
  Eye, 
  ShieldCheck, 
  Award, 
  Users, 
  ChevronRight, 
  Sparkles, 
  HeartHandshake 
} from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* ======= HERO SECTION ======= */}
      {/* Adjustment: pt-32 to compensate for fixed Header and avoid cuts */}
      <section className="relative pt-32 pb-24 md:pb-32 overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img 
                src="/Images/3.jpg" 
                alt="Medical Mission" 
                className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
            {/* Gradient identical to Features section */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-50"></div>
          </div>
          
          <div className="relative z-10 w-[90%] max-w-[1000px] mx-auto text-center px-2 md:px-4">
            {/* TRANSLUCENT BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold mb-6 animate-fade-in backdrop-blur-md">
               <HeartHandshake size={14} /> COMMITMENT TO GLOBAL HEALTH
            </div>
            {/* Adjustment: Responsive text (4xl on mobile) */}
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 md:mb-8 tracking-tight leading-tight">
              About <span className="text-blue-400">Us</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
              At MedBay, we work to connect the medical sector with efficient and 
              secure technological solutions. We facilitate global access to life-saving devices.
            </p>
          </div>
      </section>

      {/* ======= MISSION & VISION ======= */}
      {/* Adjustment: Reduced negative margin on mobile (-mt-12) */}
      <section className="relative z-20 -mt-12 md:-mt-16 pb-24 w-[90%] max-w-[1200px] mx-auto px-0 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Mission Card */}
          <div className="group bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-blue-200 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
              <Target size={28} className="md:w-8 md:h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Our Mission</h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
              To facilitate the purchase and sale of medical supplies through a 
              reliable platform that drives innovation in the healthcare sector, 
              eliminating logistical barriers and guaranteeing quality.
            </p>
          </div>

          {/* Vision Card */}
          <div className="group bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:border-indigo-200 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
              <Eye size={28} className="md:w-8 md:h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Our Vision</h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
              To become the leading marketplace in Latin America for the 
              distribution of medical products with integrated regulatory 
              compliance, being the standard of trust for hospitals and clinics.
            </p>
          </div>
        </div>
      </section>

      {/* ======= VALUES SECTION ======= */}
      <section className="py-16 md:py-24 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto px-0 md:px-0 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold mb-6">
              OPERATIONAL EXCELLENCE
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-12 md:mb-16 tracking-tight">Values that define us</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <ShieldCheck size={40} />, title: "Technical Integrity", desc: "We comply with every national and international sanitary regulation." },
              { icon: <Award size={40} />, title: "Global Quality", desc: "We only work with certified suppliers and high-end products." },
              { icon: <Users size={40} />, title: "Human Approach", desc: "We understand that behind every device there is a patient waiting." }
            ].map((value, idx) => (
              <div key={idx} className="flex flex-col items-center group">
                <div className="mb-6 p-6 bg-slate-50 rounded-[2rem] text-blue-600 transition-all duration-500 group-hover:bg-blue-600 group-hover:text-white group-hover:-translate-y-2 shadow-sm">
                  {value.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-800">{value.title}</h4>
                <p className="text-slate-500 font-medium max-w-xs leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= PREMIUM CTA SECTION ======= */}
      <section className="relative py-12 md:py-20 px-[5%]">
        <div className="max-w-[1200px] mx-auto relative min-h-[auto] md:min-h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-950 flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5">
          <div className="absolute inset-0 z-0">
            <img 
              src="/Images/2.jpg" 
              alt="Surgery Team" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-blue-900/40"></div>
          </div>

          <div className="relative z-10 p-8 md:p-20 w-full lg:w-3/5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-6 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Sparkles size={16} /> Global Collaboration
            </div>
            <h2 className="text-3xl md:text-6xl font-black text-white leading-[1.1] mb-8 tracking-tight">
              Ready to <span className="text-blue-500 italic">collaborate</span> with us?
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
              <Link 
                href="/register" 
                className="group flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 w-full sm:w-auto"
              >
                Create professional account
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/Contact" 
                className="flex items-center justify-center bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all w-full sm:w-auto"
              >
                Talk to an advisor
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex absolute right-10 xl:right-20 top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
              <img 
                src="/icons/logomed.png" 
                alt="MedBay Icon" 
                className="w-48 xl:w-64 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-700 hover:scale-105" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}