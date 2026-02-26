// frontend/src/components/layout/MainLayout.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { api } from "@/lib/api"; // ✅ Importamos la instancia para el ping

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  // Detectamos si estamos en alguna ruta de productos (catálogo)
  const isCatalog = pathname?.startsWith('/products');
  
  // Detectamos si estamos dentro del Panel de Administrador.
  const isDashboard = pathname?.startsWith('/dashboard');

  // ✅ CIRUGÍA: EL ESPÍA SILENCIOSO (Radar de Tráfico)
  useEffect(() => {
    // 🛡️ Regla 1: No rastreamos a los administradores dentro del panel para no ensuciar la data
    if (isDashboard || !pathname) return;

    const trackTraffic = async () => {
      try {
        // 1. Obtener o crear Identificador Único de Sesión
        let sessionId = localStorage.getItem('medbay_session_id');
        let country = localStorage.getItem('medbay_user_country') || 'Unknown';
        let countryCode = localStorage.getItem('medbay_user_country_code') || 'XX';

        // Si es una visita nueva, generamos ID y descubrimos su país
        if (!sessionId) {
          sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
          localStorage.setItem('medbay_session_id', sessionId);

          try {
            // Micro-consulta a un servicio público para no gastar CPU de AWS (Solo se hace 1 vez)
            const geoRes = await fetch('https://ipapi.co/json/');
            const geoData = await geoRes.json();
            if (geoData.country_name) {
              country = geoData.country_name;
              countryCode = geoData.country_code;
              localStorage.setItem('medbay_user_country', country);
              localStorage.setItem('medbay_user_country_code', countryCode);
            }
          } catch (e) {
            // Falla silenciosa: si el adblocker bloquea la petición, queda como Unknown
          }
        }

        // 2. Detección de Producto en Pantalla
        let productId = null;
        // Busca si la URL tiene el formato exacto de un producto /products/[ID-DEL-PRODUCTO]
        const productMatch = pathname.match(/^\/products\/([a-zA-Z0-9-]+)$/);
        
        if (productMatch) { 
            productId = productMatch[1];
        }

        // 3. Enviamos el "Ping" silencioso al Backend
        // No usamos 'await' aquí. Es una petición "Fire and Forget". Dispara y el UI sigue su curso.
        api.post('/traffic/ping', {
          session_id: sessionId,
          country: country,
          country_code: countryCode,
          path: pathname,
          product_id: productId
        }).catch(() => {}); // Si el backend no responde, lo ignora en silencio total

      } catch (error) {
         // Red de seguridad extrema: Nada de esto debe romper la experiencia de compra
      }
    };

    trackTraffic();
  }, [pathname, isDashboard]); // El espía se dispara cada vez que el usuario cambia de página

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* El Header decide qué mostrar según la ruta */}
      <Header variant={isCatalog ? 'catalog' : 'default'} />
      
      {/* Añadimos padding-top para compensar el Header Fixed */}
      <main className="flex-1 pt-[72px] animate-in fade-in duration-500">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}