import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script'; // ✅ Importamos Script de Next.js
import './globals.css';
import Providers from './providers';
import MainLayout from '@/components/layout/MainLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedBay - Global Access to Medical Devices',
  description: 'Plataforma B2B especializada en insumos médicos y gestión de inventario.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* ✅ CSS para ocultar el banner de Google Translate y tooltips */}
        <style dangerouslySetInnerHTML={{ __html: `
          .goog-te-banner-frame.skiptranslate { display: none !important; }
          body { top: 0px !important; }
          .goog-te-balloon-frame { display: none !important; }
          #goog-gt-tt { display: none !important; }
          .goog-te-spinner-pos { display: none !important; }
        `}} />
      </head>
      <body className={inter.className}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>

        {/* ✅ Script de inicialización de Google Translate */}
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'en,es',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>

        {/* ✅ Script principal de Google Translate */}
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}