//frontend/src/components/features/products/client/ProductQuickView.tsx

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Package, Calendar, AlertCircle, ShoppingCart, Lock, ShieldAlert } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth"; // ✅ Hook Auth
import { getImageUrl, formatCurrency, formatDate, getLotStatusConfig } from "@/lib/formatters";
import { useProductDetails } from "@/hooks/useProductDetails"; 

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView = ({ product, isOpen, onClose }: ProductQuickViewProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const { isAuthenticated } = useAuth(); // ✅ Estado de Auth

  // Solo cargar detalles si está abierto Y autenticado (para ahorrar requests de invitados)
  const { lots, categories, images, isLoadingDetails } = useProductDetails(product.id, isOpen && isAuthenticated);

  const allImages = [
    { image_url: product.primary_image, id: 'primary' },
    ...images.filter((img: any) => !img.is_primary)
  ];

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={24} className="text-gray-600"/>
        </button>

        {/* === COLUMNA IZQ: IMÁGENES (Pública) === */}
        <div className="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col items-center justify-center border-r border-gray-100">
          <div className="relative w-full h-[300px] md:h-[450px] mb-6 bg-white rounded-xl shadow-sm p-4 flex items-center justify-center border border-gray-100">
            <img 
              src={getImageUrl(allImages[currentImageIndex]?.image_url)} 
              alt={product.description} 
              className="max-w-full max-h-full object-contain mix-blend-multiply"
              onError={(e) => e.currentTarget.src = getImageUrl(null)}
            />
            
            {allImages.length > 1 && (
              <>
                <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform">
                  <ChevronLeft size={20}/>
                </button>
                <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform">
                  <ChevronRight size={20}/>
                </button>
              </>
            )}
          </div>
          
          {/* Miniaturas */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 px-1 w-full justify-center">
              {allImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-16 border-2 rounded-lg overflow-hidden flex-shrink-0 transition-all ${currentImageIndex === idx ? 'border-blue-600 scale-105 shadow-md' : 'border-gray-200 opacity-70 bg-white'}`}
                >
                  <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === COLUMNA DER: INFO Y LOTES === */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto bg-white custom-scrollbar">
          <div className="mb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 block">
              {product.manufacturer_name || "Fabricante Genérico"}
            </span>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.description}</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
               <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-mono border border-gray-200">
                 SKU: {product.global_sku}
               </span>
               {isAuthenticated && categories.map((cat: any) => (
                 <span key={cat.id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border border-blue-100">
                   {cat.name}
                 </span>
               ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          {/* ✅ LÓGICA DE PROTECCIÓN */}
          {!isAuthenticated ? (
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-[300px]">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                   <Lock size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Información Protegida</h3>
                <p className="text-slate-500 mb-8 max-w-xs">
                   Los precios, lotes disponibles y fechas de caducidad son exclusivos para miembros verificados.
                </p>
                <Link href="/login" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg">
                   Iniciar Sesión para Ver Detalles
                </Link>
                <div className="mt-4 text-xs text-slate-400">
                   ¿No tienes cuenta? <Link href="/register" className="text-blue-600 underline">Regístrate gratis</Link>
                </div>
             </div>
          ) : (
             // ✅ VISTA LOGUEADO (INVENTARIO COMPLETO)
             <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <Package size={20} className="text-blue-500"/> Inventario Disponible
                  </h3>
                </div>

                <div className="space-y-3">
                  {isLoadingDetails ? (
                     [1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse"></div>)
                  ) : lots.length > 0 ? (
                    lots.map((lot: any) => {
                      const config = getLotStatusConfig(lot.status, lot.expiry_date);
                      const price = lot.discount_price_amount || lot.price_amount || lot.price;

                      return (
                        <div key={lot.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all bg-white group">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
                                 {config.label}
                              </span>
                              <p className="text-[10px] text-gray-400 mt-2 font-mono">Lote: {lot.lot_number}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-2xl font-bold text-blue-700">{formatCurrency(price)}</p>
                               <p className="text-xs text-gray-400">Existencias: {lot.quantity}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400"/> 
                              <span>Caducidad: <strong className="text-gray-800">{formatDate(lot.expiry_date)}</strong></span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm shadow-md">
                              <ShoppingCart size={16}/> Agregar
                            </button>
                            <button className="flex-1 border-2 border-blue-600 text-blue-600 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition-colors text-sm">
                              Comprar Ahora
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                         <AlertCircle className="text-slate-400" size={32} />
                      </div>
                      <h4 className="text-slate-700 font-bold mb-1">Producto bajo pedido</h4>
                      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                        Actualmente no tenemos lotes publicados para venta directa.
                      </p>
                      <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                        Solicitar Cotización
                      </button>
                    </div>
                  )}
                </div>
             </>
          )}
        </div>
      </div>
    </div>,
    document.body 
  );
};