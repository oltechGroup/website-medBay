//frontend/src/app/components/features/products/client/ClientProductCard.tsx

"use client";

import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { ChevronDown, ChevronUp, ShoppingCart, Package, Calendar, AlertTriangle, CheckCircle, XCircle, FileText } from "lucide-react";
import { formatCurrency, formatDate, getImageUrl, getLotStatusConfig } from "@/lib/formatters"; 
import { useProductDetails } from "@/hooks/useProductDetails"; 
import { ProductQuickView } from "./ProductQuickView"; 

interface ClientProductCardProps {
  product: Product;
  filterStatus?: string; // ✅ NUEVO: Recibimos el contexto (ej: 'expired')
}

export const ClientProductCard = ({ product, filterStatus = 'all' }: ClientProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // ✅ ENVIAMOS EL FILTRO AL HOOK
  // Si filterStatus es 'expired', el hook traerá solo lotes caducados.
  const { lots, isLoadingLots } = useProductDetails(product.id, isExpanded, filterStatus);

  const hasActiveLots = product.active_lots && product.active_lots > 0;

  return (
    <>
      <div className={`
        relative w-full bg-white rounded-2xl border transition-all duration-300 overflow-hidden
        ${isExpanded ? 'shadow-xl border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-gray-100 hover:shadow-md'}
      `}>
        
        {/* === CARD HEADER === */}
        <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
          
          {/* 1. IMAGEN */}
          <div 
            onClick={() => setIsModalOpen(true)} 
            className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-50 rounded-xl p-2 border border-gray-100 cursor-pointer group hover:border-blue-300 transition-colors"
          >
            <img 
              src={getImageUrl(product.primary_image)} 
              alt={product.description}
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
              onError={(e) => e.currentTarget.src = getImageUrl(null)}
            />
          </div>

          {/* 2. INFO */}
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
               {hasActiveLots ? (
                 <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full text-xs border border-green-100">
                   <Package size={12} /> {product.active_lots} Lotes disponibles
                 </span>
               ) : (
                 <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full text-xs border border-amber-100">
                   <AlertTriangle size={12} /> Bajo stock
                 </span>
               )}
            </div>
          </div>

          {/* 3. PRECIO Y ACCIÓN */}
          <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-4 md:gap-1 pl-0 md:pl-6 md:border-l border-gray-100 min-w-[140px]">
            <div className="text-right w-full">
               {hasActiveLots ? (
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
               )}
            </div>
            
            {hasActiveLots ? (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${isExpanded ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
              >
                {isExpanded ? <>Cerrar <ChevronUp size={16} /></> : <>Ver Lotes <ChevronDown size={16} /></>}
              </button>
            ) : (
              <button className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-700 text-sm shadow-md">
                <FileText size={14}/> Cotizar
              </button>
            )}
          </div>
        </div>

        {/* === EXPANDIBLE (TABLA DE LOTES) === */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
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
                      
                      {/* Status */}
                      <div className="col-span-6 md:col-span-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
                          {config.label}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">Lote: {lot.lot_number}</p>
                      </div>

                      {/* Caducidad */}
                      <div className="col-span-6 md:col-span-3 flex items-center gap-2 text-sm text-gray-600">
                         <Calendar size={16} className="text-gray-400"/> 
                         <div className="flex flex-col">
                           <span className="text-[10px] text-gray-400 uppercase">Vencimiento</span>
                           <span className="font-medium">{formatDate(lot.expiry_date)}</span>
                         </div>
                      </div>

                      {/* Stock y Precio */}
                      <div className="col-span-6 md:col-span-3 text-right md:text-left flex flex-col">
                         <span className="text-[10px] text-gray-500">Stock: {lot.quantity} pzas</span>
                         <span className="font-bold text-blue-700 text-lg">{formatCurrency(price)}</span>
                      </div>

                      {/* Botones */}
                      <div className="col-span-6 md:col-span-3 flex justify-end gap-2">
                         {hasPrice ? (
                           <>
                             <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-blue-600 transition-colors" title="Añadir al carrito">
                               <ShoppingCart size={18}/>
                             </button>
                             <button className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md">
                               Comprar
                             </button>
                           </>
                         ) : (
                           <button className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 w-full shadow-md">
                             Cotizar
                           </button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No hay lotes disponibles con este criterio ({filterStatus === 'all' ? 'General' : filterStatus}).
              </div>
            )}
          </div>
        )}
      </div>

      {/* RENDERIZADO DEL MODAL */}
      <ProductQuickView 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};