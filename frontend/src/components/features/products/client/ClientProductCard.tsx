// frontend/src/app/components/features/products/client/ClientProductCard.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronDown, ChevronUp, ShoppingCart, Package, Calendar, 
  AlertTriangle, Lock, Heart, FileText 
} from "lucide-react";
import { formatCurrency, formatDate, getImageUrl, getLotStatusConfig } from "@/lib/formatters";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductQuickView } from "./ProductQuickView";
import QuoteModal from "./QuoteModal";
import { QuantitySelector } from "@/components/ui/QuantitySelector";

// --- SUB-COMPONENTE: FILA DE LOTE ---
interface LotRowProps {
  lot: any;
  onAddToCart: (lotId: string, quantity: number, redirect?: boolean) => Promise<void>;
  isAdding: boolean;
}

const LotRow = ({ lot, onAddToCart, isAdding }: LotRowProps) => {
  const [quantity, setQuantity] = useState(1);
  const config = getLotStatusConfig(lot.status, lot.expiry_date);
  const price = lot.discount_price_amount || lot.price_amount || lot.price;
  const hasPrice = price && parseFloat(price) > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 grid md:grid-cols-12 gap-4 items-center hover:border-blue-300 transition-all shadow-sm group">
      
      {/* 1. Info Estado y Lote */}
      <div className="col-span-12 md:col-span-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
          {config.label}
        </span>
        <p className="text-[11px] text-gray-400 mt-1.5 font-mono flex items-center gap-1">
          <Package size={10} /> Lote: <span className="text-slate-600 font-bold">{lot.lot_number}</span>
        </p>
      </div>

      {/* 2. Caducidad */}
      <div className="col-span-6 md:col-span-3 flex items-center gap-3 text-sm text-gray-600">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
          <Calendar size={18}/>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Vencimiento</span>
          <span className="font-bold text-slate-700">{formatDate(lot.expiry_date)}</span>
        </div>
      </div>

      {/* 3. Precio y Stock */}
      <div className="col-span-6 md:col-span-3 text-right md:text-left flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">Precio Unitario</span>
        <span className="font-black text-blue-700 text-lg">{formatCurrency(price)}</span>
        <span className="text-[10px] text-gray-400 mt-0.5">Stock: {lot.quantity} pzas</span>
      </div>

      {/* 4. Controles de Acción */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-2">
        {hasPrice ? (
          <>
            <div className="flex justify-end w-full">
              <QuantitySelector 
                quantity={quantity}
                max={lot.quantity}
                onIncrease={() => setQuantity(q => q + 1)}
                onDecrease={() => setQuantity(q => q - 1)}
                disabled={isAdding}
                size="sm"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onAddToCart(lot.id, quantity, false)}
                disabled={isAdding}
                className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                title="Añadir al carrito"
              >
                <ShoppingCart size={14} /> Añadir
              </button>
              <button 
                onClick={() => onAddToCart(lot.id, quantity, true)} 
                disabled={isAdding}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors text-xs font-bold"
              >
                Comprar
              </button>
            </div>
          </>
        ) : (
          <div className="w-full">
             <div className="text-right text-xs font-bold text-gray-400 italic py-2">
               Precio bajo cotización
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface ClientProductCardProps {
  product: Product;
  filterStatus?: string;
}

export const ClientProductCard = ({ product, filterStatus = 'all' }: ClientProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Hooks
  const { addToCart, isAdding } = useCart();
  const { addToWishlist, removeFromWishlist, useWishlistStatus } = useWishlist();
  
  // Verificar si este producto ya está en favoritos
  const { data: isInWishlist } = useWishlistStatus(product.id);

  // ✅ CAMBIO 1: Eliminamos "&& isAuthenticated". Cargamos lotes siempre que esté expandido.
  const { lots, isLoadingLots } = useProductDetails(product.id, isExpanded, filterStatus);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasActiveLots = product.active_lots && product.active_lots > 0;

  const handleMainAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // ✅ CAMBIO 2: Lógica de protección en la acción de compra
  const handleAddToCart = async (lotId: string, quantity: number, redirect: boolean = false) => {
    // Si no es usuario registrado, mandamos al login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await addToCart({ lotId, quantity });
      if (redirect) {
        router.push('/checkout');
      }
    } catch (error) {
      console.error("Error agregando al carrito", error);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // También protegemos favoritos
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isInWishlist) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  return (
    <>
      <div className={`
        relative w-full bg-white rounded-2xl border transition-all duration-300 overflow-hidden group/card
        ${isExpanded ? 'shadow-xl border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-gray-100 hover:shadow-md'}
      `}>
        
        {/* === CARD HEADER === */}
        <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
          
          {/* IMAGEN + BOTÓN FAVORITOS */}
          <div className="relative w-full md:w-32 h-32 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
             <div 
               onClick={() => setIsModalOpen(true)} 
               className="w-full h-full p-2 cursor-pointer bg-white"
             >
                <img 
                  src={getImageUrl(product.primary_image)} 
                  alt={product.description}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover/card:scale-105"
                  onError={(e) => e.currentTarget.src = getImageUrl(null)}
                />
             </div>

             {/* BOTÓN FAVORITOS */}
             {mounted && (
               <button 
                 onClick={handleToggleWishlist}
                 className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm border transition-all z-10
                   ${isInWishlist 
                     ? 'bg-red-50 border-red-100 text-red-500' 
                     : 'bg-white border-gray-200 text-gray-300 hover:text-red-400 hover:border-red-100'}
                 `}
               >
                 <Heart size={14} className={isInWishlist ? "fill-current" : ""} />
               </button>
             )}
          </div>

          {/* INFO */}
          <div className="flex-1 w-full text-center md:text-left space-y-2 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
              {product.manufacturer_name || "Fabricante Genérico"}
            </div>

            <h3 className="text-lg font-bold text-gray-800 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
              {product.description}
            </h3>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-500">
               <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
                 SKU: {product.global_sku || 'N/A'}
               </span>
               
               {/* ✅ CAMBIO 3: Mostrar stock real a todos */}
               {mounted && (
                   hasActiveLots ? (
                     <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] border border-emerald-100">
                       <Package size={12} /> {product.active_lots} Lotes disponibles
                     </span>
                   ) : (
                     <span className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full text-[10px] border border-amber-100">
                       <AlertTriangle size={12} /> Bajo stock
                     </span>
                   )
               )}
            </div>
          </div>

          {/* PRECIO Y ACCIÓN */}
          <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-4 md:gap-1 pl-0 md:pl-6 md:border-l border-gray-100 min-w-[160px]">
            <div className="text-right w-full">
               {/* ✅ CAMBIO 3: Mostrar precio real a todos */}
               {mounted && (
                 hasActiveLots ? (
                   <>
                     <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-bold">Precio Unitario</p>
                     {product.min_price === product.max_price ? (
                        <p className="text-xl font-black text-blue-600">{formatCurrency(product.min_price)}</p>
                     ) : (
                       <div className="flex flex-col items-end">
                         <p className="text-[10px] text-gray-500 font-medium">Desde</p>
                         <p className="text-lg font-black text-blue-600">{formatCurrency(product.min_price)}</p>
                       </div>
                     )}
                   </>
                 ) : (
                   <p className="text-sm font-bold text-gray-400 italic bg-gray-50 px-2 py-1 rounded">Cotizar precio</p>
                 )
               )}
            </div>
            
            <button 
              onClick={handleMainAction}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wide
              ${isExpanded 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-900/10' 
               }`}
            >
              {isExpanded ? (
                  <>Cerrar <ChevronUp size={14} /></>
              ) : (
                  // ✅ CAMBIO 3: Botón estándar para todos
                  <>Ver Opciones <ChevronDown size={14} /></>
              )}
            </button>
          </div>
        </div>

        {/* === ZONA EXPANDIBLE (LISTA DE LOTES) === */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-slate-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
            
            {/* ✅ CAMBIO 4: Eliminada la sección de "Acceso Exclusivo". Renderizado directo. */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <Package className="text-blue-500" size={16}/> 
                  {filterStatus !== 'all' 
                    ? `Inventario Filtrado (${filterStatus === 'expired' ? 'Caducados' : 'Próximos a vencer'})` 
                    : 'Selecciona un lote'}
                </h4>
                
                {!hasActiveLots && (
                  <button 
                    onClick={() => setIsQuoteOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FileText size={12}/> Solicitar Cotización
                  </button>
                )}
            </div>

            {isLoadingLots ? (
                <div className="space-y-3">
                    {[1,2].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse"></div>)}
                </div>
            ) : lots.length > 0 ? (
                <div className="grid gap-3">
                  {lots.map((lot: any) => (
                    <LotRow 
                      key={lot.id} 
                      lot={lot} 
                      onAddToCart={handleAddToCart}
                      isAdding={isAdding}
                    />
                  ))}
                </div>
            ) : (
                // SIN LOTES DISPONIBLES
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="text-amber-400" size={24} />
                  </div>
                  <p className="text-slate-600 font-bold text-sm mb-1">Agotado temporalmente</p>
                  <p className="text-slate-400 text-xs mb-4">No hay lotes disponibles bajo este criterio.</p>
                  <button 
                    onClick={() => setIsQuoteOpen(true)}
                    className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg text-xs transition-colors border border-blue-100"
                  >
                    Solicitar búsqueda de producto
                  </button>
                </div>
            )}

          </div>
        )}
      </div>

      {/* MODALES */}
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