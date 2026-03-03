// frontend/src/components/layout/Footer.tsx

import Link from "next/link";
import { ChevronRight, Facebook, Instagram } from "lucide-react"; // Añadimos los iconos

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
      <div className="w-[90%] max-w-[1400px] mx-auto px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
          
          {/* COLUMN 1: BRANDING & SOCIALS */}
          <div className="space-y-6">
            <img 
              src="/icons/logocompletoblanco.png" 
              alt="MedBay Full Logo" 
              className="w-52 mx-auto md:mx-0 opacity-90" 
            />
            <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0 font-medium italic">
              Leading strategic partner in the distribution and smart management of B2B medical devices.
            </p>
            
            {/* SOCIAL MEDIA ICONS */}
            <div className="flex justify-center md:justify-start gap-5 pt-2">
              <a 
                href="https://www.facebook.com/profile.php?id=61586918317156" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/medbay_supply/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* COLUMN 2: PLATFORM */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50">
              Platform
            </h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li>
                <Link href="/About" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors">
                  <ChevronRight size={14}/> About Us
                </Link>
              </li>
              <li>
                <Link href="/Characteristics" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors">
                  <ChevronRight size={14}/> Features
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-blue-400 flex items-center justify-center md:justify-start gap-2 transition-colors">
                  <ChevronRight size={14}/> Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: SUPPORT */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50">
              Support
            </h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li>
                <Link href="/Contact" className="hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors">
                  <ChevronRight size={14}/> Contact
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors">
                  <ChevronRight size={14}/> Returns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors">
                  <ChevronRight size={14}/> User Guide
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: LEGAL */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 underline underline-offset-8 decoration-blue-500/50">
              Legal
            </h4>
            <ul className="space-y-4 text-sm font-semibold">
              <li>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Business Terms</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">ISO Compliance</a>
              </li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT & BADGES */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 text-center md:text-left">
            © 2025 MedBay Inc. Global Access to Medical Devices.
          </p>
          <div className="flex gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
            <img src="/icons/logomedblanco.png" alt="Icon" className="h-5" />
            <span className="text-white text-[10px] font-black border border-white px-2 py-0.5 rounded">
              MEDBAY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}