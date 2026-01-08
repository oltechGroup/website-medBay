//frontend/src/components/features/products/client/ProductQuickView.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Package, Calendar, AlertCircle, ShoppingCart, Lock, FileText, CheckCircle2 } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth"; 
import { getImageUrl, formatCurrency, formatDate, getLotStatusConfig } from "@/lib/formatters";
import { useProductDetails } from "@/hooks/useProductDetails"; 
import { useCart } from "@/hooks/useCart";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import QuoteModal from "./QuoteModal"; 

// --- SUB-COMPONENTE: ÍTEM DE LOTE EN MODAL ---
interface LotItemProps {
  lot: any;
  onAddToCart: (lotId: string, quantity: number, redirect?: boolean) => Promise<void>;
  isAdding: boolean;
}

const LotItem = ({ lot, onAddToCart, isAdding }: LotItemProps) => {
  const [quantity, setQuantity] = useState(1);
  const config = getLotStatusConfig(lot.status, lot.expiry_date);
  const price = lot.discount_price_amount || lot.price_amount || lot.price;
  
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all bg-white group">
      {/* Encabezado del Lote */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
             {config.label}
          </span>
          <p className="text-xs text-gray-400 mt-2 font-mono flex items-center gap-1">
            <Package size={12}/> Lote: <span className="text-slate-700 font-bold">{lot.lot_number}</span>
          </p>
        </div>
        <div className="text-right">
           <p className="text-2xl font-black text-blue-700">{formatCurrency(price)}</p>
           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Disponible: {lot.quantity}</p>
        </div>
      </div>

      {/* Info Caducidad */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <Calendar size={14} className="text-blue-500"/> 
        <span>Vence: <strong className="text-slate-800">{formatDate(lot.expiry_date)}</strong></span>
      </div>

      {/* Controles de Compra */}
      <div className="flex flex-col gap-3">
        {/* Selector de Cantidad */}
        <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-slate-400 uppercase">Cantidad</span>
           <QuantitySelector 
             quantity={quantity}
             max={lot.quantity}
             onIncrease={() => setQuantity(q => q + 1)}
             onDecrease={() => setQuantity(q => q - 1)}
             disabled={isAdding}
             size="sm"
           />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <button 
            onClick={() => onAddToCart(lot.id, quantity, false)}
            disabled={isAdding}
            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200 hover:text-blue-600 transition-colors text-xs"
          >
            <ShoppingCart size={16}/> Agregar
          </button>
          <button 
            onClick={() => onAddToCart(lot.id, quantity, true)}
            disabled={isAdding}
            className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors text-xs shadow-lg shadow-blue-600/20"
          >
            Comprar Ahora
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView = ({ product, isOpen, onClose }: ProductQuickViewProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false); 
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { addToCart, isAdding } = useCart();

  // Solo cargar detalles si está abierto Y autenticado
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

  // ✅ HANDLER ACTUALIZADO: Redirección directa al Checkout
  const handleAddToCart = async (lotId: string, quantity: number, redirect: boolean = false) => {
    try {
      await addToCart({ lotId, quantity });
      if (redirect) {
        router.push('/checkout'); // <-- Ahora redirige al pago
      } else {
        onClose(); // Si solo agrega, cierra el modal
      }
    } catch (error) {
      console.error("Error agregando al carrito", error);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="relative bg-white rounded-[2rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
          >
            <X size={20} className="text-slate-500"/>
          </button>

          {/* === COLUMNA IZQ: IMÁGENES (Pública) === */}
          <div className="w-full md:w-1/2 bg-slate-50/50 p-8 flex flex-col items-center justify-center border-r border-slate-100">
            <div className="relative w-full h-[300px] md:h-[450px] mb-8 bg-white rounded-3xl shadow-sm p-6 flex items-center justify-center border border-white">
              <img 
                src={getImageUrl(allImages[currentImageIndex]?.image_url)} 
                alt={product.description} 
                className="max-w-full max-h-full object-contain mix-blend-multiply"
                onError={(e) => e.currentTarget.src = getImageUrl(null)}
              />
              
              {allImages.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:scale-110 transition-transform text-slate-600 border border-slate-100">
                    <ChevronLeft size={20}/>
                  </button>
                  <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:scale-110 transition-transform text-slate-600 border border-slate-100">
                    <ChevronRight size={20}/>
                  </button>
                </>
              )}
            </div>
            
            {/* Miniaturas */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto py-2 px-1 w-full justify-center">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 
                      ${currentImageIndex === idx 
                        ? 'border-blue-600 scale-110 shadow-lg ring-2 ring-blue-100' 
                        : 'border-transparent opacity-60 hover:opacity-100 bg-white'}`}
                  >
                    <img src={getImageUrl(img.image_url)} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* === COLUMNA DER: INFO Y LOTES === */}
          <div className="w-full md:w-1/2 flex flex-col h-full bg-white relative">
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    {product.manufacturer_name || "Fabricante Genérico"}
                  </span>
                  
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">
                    {product.description}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                     <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-200">
                       SKU: {product.global_sku}
                     </span>
                     {isAuthenticated && categories.map((cat: any) => (
                       <span key={cat.id} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-blue-100">
                         {cat.name}
                       </span>
                     ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full mb-8"></div>

                {/* ✅ LÓGICA DE PROTECCIÓN */}
                {!isAuthenticated ? (
                   <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-10 text-center flex flex-col items-center justify-center">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-6">
                         <Lock size={32} className="text-slate-400" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-2">Información Protegida</h3>
                      <p className="text-slate-500 mb-8 max-w-xs font-medium leading-relaxed">
                         Los precios, lotes disponibles y fechas de caducidad son exclusivos para miembros verificados.
                      </p>
                      <button 
                        onClick={() => router.push('/login')} 
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 mb-4"
                      >
                          Iniciar Sesión
                      </button>
                      <p className="text-xs text-slate-400 font-bold">
                          ¿No tienes cuenta? <button onClick={() => router.push('/register')} className="text-blue-600 hover:underline">Regístrate gratis</button>
                      </p>
                   </div>
                ) : (
                   // ✅ VISTA LOGUEADO (INVENTARIO COMPLETO)
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                          <Package size={20} className="text-blue-600"/> Inventario Disponible
                        </h3>
                        <button 
                          onClick={() => setIsQuoteOpen(true)}
                          className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                          <FileText size={14} /> Solicitar Cotización
                        </button>
                      </div>

                      <div className="space-y-4">
                        {isLoadingDetails ? (
                           [1,2].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>)
                        ) : lots.length > 0 ? (
                           lots.map((lot: any) => (
                             <LotItem 
                               key={lot.id}
                               lot={lot}
                               onAddToCart={handleAddToCart}
                               isAdding={isAdding}
                             />
                           ))
                        ) : (
                           <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <AlertCircle className="text-amber-400" size={32} />
                             </div>
                             <h4 className="text-slate-800 font-bold mb-1">Producto bajo pedido</h4>
                             <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto font-medium">
                               Actualmente no tenemos lotes publicados para venta directa.
                             </p>
                             <button 
                               onClick={() => setIsQuoteOpen(true)}
                               className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all text-sm"
                             >
                               Solicitar Cotización
                             </button>
                           </div>
                        )}
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* ✅ Modal Cotización dentro del portal */}
      {isQuoteOpen && (
        <QuoteModal 
          isOpen={isQuoteOpen}
          onClose={() => setIsQuoteOpen(false)}
          product={product}
        />
      )}
    </>,
    document.body 
  );
};