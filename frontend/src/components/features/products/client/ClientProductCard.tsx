//frontend/src/app/components/features/products/client/ClientProductCard.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; 
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth"; 
import { ChevronDown, ChevronUp, ShoppingCart, Package, Calendar, AlertTriangle, CheckCircle, XCircle, FileText, Lock, UserCircle, Heart } from "lucide-react";
import { formatCurrency, formatDate, getImageUrl, getLotStatusConfig } from "@/lib/formatters"; 
import { useProductDetails } from "@/hooks/useProductDetails"; 
import { useCart } from "@/hooks/useCart"; 
import { useWishlist } from "@/hooks/useWishlist"; // ✅ IMPORTADO
import { ProductQuickView } from "./ProductQuickView"; 
import QuoteModal from "./QuoteModal";

interface ClientProductCardProps {
  product: Product;
  filterStatus?: string;
}

export const ClientProductCard = ({ product, filterStatus = 'all' }: ClientProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const { isAuthenticated } = useAuth(); 
  const [mounted, setMounted] = useState(false);
  
  // Hooks
  const { addToCart, isAdding } = useCart();
  const { addToWishlist, removeFromWishlist, useWishlistStatus } = useWishlist(); // ✅ Hook Wishlist
  
  // Verificar si este producto ya está en favoritos
  const { data: isInWishlist } = useWishlistStatus(product.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { lots, isLoadingLots } = useProductDetails(product.id, isExpanded && isAuthenticated, filterStatus);

  const hasActiveLots = product.active_lots && product.active_lots > 0;

  const handleMainAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleAddToCart = async (lotId: string, quantity: number = 1) => {
    try {
      await addToCart({ lotId, quantity });
    } catch (error) {
      console.error("Error agregando al carrito", error);
    }
  };

  // ✅ Handler para Favoritos
  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir el modal al dar click
    if (!isAuthenticated) return; // O podrías redirigir a login

    if (isInWishlist) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  return (
    <>
      <div className={`
        relative w-full bg-white rounded-2xl border transition-all duration-300 overflow-hidden
        ${isExpanded ? 'shadow-xl border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-gray-100 hover:shadow-md'}
      `}>
        
        {/* === CARD HEADER === */}
        <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
          
          {/* IMAGEN + BOTÓN FAVORITOS */}
          <div className="relative w-full md:w-32 h-32 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 group">
             {/* Imagen Clickeable */}
             <div 
                onClick={() => setIsModalOpen(true)} 
                className="w-full h-full p-2 cursor-pointer"
             >
                <img 
                  src={getImageUrl(product.primary_image)} 
                  alt={product.description}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                  onError={(e) => e.currentTarget.src = getImageUrl(null)}
                />
             </div>

             {/* ✅ BOTÓN FLOTANTE FAVORITOS (Solo si logueado) */}
             {mounted && isAuthenticated && (
               <button 
                 onClick={handleToggleWishlist}
                 className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm border transition-all z-10
                   ${isInWishlist 
                     ? 'bg-red-50 border-red-100 text-red-500' 
                     : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'}
                 `}
               >
                 <Heart size={14} className={isInWishlist ? "fill-current" : ""} />
               </button>
             )}
          </div>

          {/* INFO */}
          <div className="flex-1 w-full text-center md:text-left space-y-2 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
              {product.manufacturer_name || "Fabricante Genérico"}
            </div>

            <h3 className="text-lg font-bold text-gray-800 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
              {product.description}
            </h3>
            
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
               <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600 border border-gray-200">
                 SKU: {product.global_sku || 'N/A'}
               </span>
               
               {mounted && isAuthenticated ? (
                   hasActiveLots ? (
                     <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full text-xs border border-green-100">
                       <Package size={12} /> {product.active_lots} Lotes disponibles
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full text-xs border border-amber-100">
                       <AlertTriangle size={12} /> Bajo stock
                     </span>
                   )
               ) : (
                   <span className="flex items-center gap-1 text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full text-xs border border-slate-200">
                     <Lock size={10} /> Stock Reservado
                   </span>
               )}
            </div>
          </div>

          {/* PRECIO Y ACCIÓN */}
          <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-4 md:gap-1 pl-0 md:pl-6 md:border-l border-gray-100 min-w-[160px]">
            <div className="text-right w-full">
               {mounted && isAuthenticated ? (
                 hasActiveLots ? (
                   <>
                     <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Precio Unitario</p>
                     {product.min_price === product.max_price ? (
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(product.min_price)}</p>
                     ) : (
                       <div className="flex flex-col items-end">
                         <p className="text-xs text-gray-500">Desde</p>
                         <p className="text-lg font-bold text-blue-600">{formatCurrency(product.min_price)}</p>
                       </div>
                     )}
                   </>
                 ) : (
                   <p className="text-sm font-bold text-gray-500 italic">Precio a cotizar</p>
                 )
               ) : (
                 <div className="flex flex-col items-end opacity-60">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Precio</p>
                    <div className="text-lg font-bold text-slate-300 blur-[2px] select-none">$$$.$$</div>
                    <span className="text-[10px] text-blue-500 font-semibold">Ver detalles</span>
                 </div>
               )}
            </div>
            
            <button 
              onClick={handleMainAction}
              className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm 
              ${isExpanded 
                  ? 'bg-gray-100 text-gray-600' 
                  : isAuthenticated 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800 text-white hover:bg-slate-700 shadow-md'
               }`}
            >
              {isExpanded ? (
                  <>Cerrar <ChevronUp size={16} /></>
              ) : isAuthenticated ? (
                  <>Ver Lotes <ChevronDown size={16} /></>
              ) : (
                  <><Lock size={14} /> Ver Lotes</>
              )}
            </button>
          </div>
        </div>

        {/* === EXPANDIBLE === */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
            
            {mounted && !isAuthenticated ? (
               <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                     <UserCircle className="text-slate-400" size={32} />
                  </div>
                  <h4 className="text-slate-800 font-bold text-lg mb-2">Acceso Exclusivo a Profesionales</h4>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                     Para visualizar fechas de caducidad exactas, precios por volumen y disponibilidad de lotes, necesitas una cuenta verificada.
                  </p>
                  <div className="flex justify-center gap-4">
                     <Link href="/login" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                        Iniciar Sesión
                     </Link>
                     <Link href="/register" className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">
                        Registrarse
                     </Link>
                  </div>
               </div>
            ) : (
               <>
                  <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Package className="text-blue-500" size={18}/> 
                    {filterStatus !== 'all' 
                      ? `Lotes filtrados (${filterStatus === 'expired' ? 'Caducados' : 'Próximos a vencer'})` 
                      : 'Selecciona un lote para agregar al carrito'}
                  </h4>

                  {isLoadingLots ? (
                    <div className="space-y-3">
                        {[1,2].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>)}
                    </div>
                  ) : lots.length > 0 ? (
                    <div className="grid gap-3">
                      {lots.map((lot: any) => {
                        const config = getLotStatusConfig(lot.status, lot.expiry_date);
                        const price = lot.discount_price_amount || lot.price_amount || lot.price; 
                        const hasPrice = price && parseFloat(price) > 0;

                        return (
                          <div key={lot.id} className="bg-white border border-gray-200 rounded-lg p-3 grid md:grid-cols-12 gap-4 items-center hover:border-blue-300 transition-colors shadow-sm">
                            
                            <div className="col-span-6 md:col-span-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
                                {config.label}
                              </span>
                              <p className="text-[10px] text-gray-400 mt-1 font-mono">Lote: {lot.lot_number}</p>
                            </div>

                            <div className="col-span-6 md:col-span-3 flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} className="text-gray-400"/> 
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 uppercase">Vencimiento</span>
                                  <span className="font-medium">{formatDate(lot.expiry_date)}</span>
                                </div>
                            </div>

                            <div className="col-span-6 md:col-span-3 text-right md:text-left flex flex-col">
                                <span className="text-[10px] text-gray-500">Stock: {lot.quantity} pzas</span>
                                <span className="font-bold text-blue-700 text-lg">{formatCurrency(price)}</span>
                            </div>

                            <div className="col-span-6 md:col-span-3 flex justify-end gap-2">
                                {hasPrice ? (
                                  <>
                                    <button 
                                      onClick={() => handleAddToCart(lot.id, 1)}
                                      disabled={isAdding}
                                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-blue-600 transition-colors" title="Añadir al carrito"
                                    >
                                      <ShoppingCart size={18}/>
                                    </button>
                                    <button 
                                      onClick={() => handleAddToCart(lot.id, 1)} 
                                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md"
                                    >
                                      Comprar
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => setIsQuoteOpen(true)} 
                                    className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 w-full shadow-md flex items-center justify-center gap-2"
                                  >
                                    <FileText size={14} /> Cotizar
                                  </button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm bg-slate-50 rounded-lg border border-slate-100">
                      <p className="mb-2">No hay lotes disponibles con este criterio.</p>
                      <button 
                        onClick={() => setIsQuoteOpen(true)}
                        className="text-blue-600 font-bold hover:underline text-xs"
                      >
                        Solicitar Cotización de este producto
                      </button>
                    </div>
                  )}
               </>
            )}
          </div>
        )}
      </div>

      <ProductQuickView 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      <QuoteModal 
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        product={product}
      />
    </>
  );
};