// frontend/src/components/features/products/client/ClientProductCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronDown, ChevronUp, ShoppingCart, Package, Calendar, 
  AlertTriangle, Heart, FileText, Info, CheckCircle
} from "lucide-react";
import { formatCurrency, formatDate, getImageUrl, getLotStatusConfig } from "@/lib/formatters";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import QuoteModal, { QuoteContext } from "./QuoteModal"; 
import { QuantitySelector } from "@/components/ui/QuantitySelector";

// --- SUB-COMPONENT: LOT ROW ---
interface LotRowProps {
  lot: any;
  onAddToCart: (lotId: string, quantity: number, redirect?: boolean) => Promise<void>;
  isAdding: boolean;
  onQuote: (lot: any) => void;
}

const LotRow = ({ lot, onAddToCart, isAdding, onQuote }: LotRowProps) => {
  const [quantity, setQuantity] = useState(1);
  const config = getLotStatusConfig(lot.status, lot.expiry_date);
  const price = lot.discount_price_amount || lot.price_amount || lot.price;
  
  const hasPrice = price && parseFloat(price) > 0;
  const hasStock = lot.quantity > 0;
  const isEquipment = lot.status === 'equipment';

  // Lógica Inteligente para visualización de Lotes
  const renderLotActions = () => {
    // Si tiene Precio y Cantidad -> COMPRA DIRECTA (Aplica tanto para Insumos como para Equipo)
    if (hasPrice && hasStock) {
      return (
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
              title="Add to cart"
            >
              <ShoppingCart size={14} />
            </button>
            <button 
              onClick={() => onAddToCart(lot.id, quantity, true)} 
              disabled={isAdding}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors text-xs font-bold"
            >
              Buy Now
            </button>
          </div>
        </>
      );
    }

    // SI FALTA PRECIO O CANTIDAD -> FLUJOS DE COTIZACIÓN
    
    // CASO 1: TIENE PRECIO, PERO NO CANTIDAD (Bajo en Stock / Solicitar Disponibilidad)
    if (hasPrice && !hasStock) {
      return (
        <button
          onClick={() => onQuote(lot)}
          className="w-full bg-amber-50 border-2 border-amber-200 text-amber-700 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold hover:bg-amber-100"
        >
          <AlertTriangle size={14} /> Check Availability
        </button>
      );
    }

    // CASO 2: TIENE CANTIDAD, PERO NO PRECIO (Solicitar Cotización)
    if (!hasPrice && hasStock) {
       return (
        <button
          onClick={() => onQuote(lot)}
          className="w-full bg-white border-2 border-blue-200 text-blue-600 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-50"
        >
          <FileText size={14} /> Request Quote
        </button>
      );
    }

    // CASO 3: NO TIENE NI PRECIO NI CANTIDAD (Solo Fecha o Nada) -> Solicitar Disponibilidad General / Cotizar Equipo
    return (
      <button
        onClick={() => onQuote(lot)}
        className="w-full bg-white border-2 border-slate-200 text-slate-600 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-50"
      >
        <Info size={14} /> {isEquipment ? 'Quote Equipment' : 'Inquire Status'}
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 grid md:grid-cols-12 gap-4 items-center hover:border-blue-300 transition-all shadow-sm group">
      
      {/* 1. Status and Lot Info */}
      <div className="col-span-12 md:col-span-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${config.color}`}>
          {config.label}
        </span>
        {lot.lot_number && (
          <p className="text-[11px] text-gray-400 mt-1.5 font-mono flex items-center gap-1">
            <Package size={10} /> Lot: <span className="text-slate-600 font-bold">{lot.lot_number}</span>
          </p>
        )}
      </div>

      {/* 2. Expiration or Condition (EQUIPO vs INSUMO) */}
      <div className="col-span-6 md:col-span-3 flex items-center gap-3 text-sm text-gray-600">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
          {isEquipment ? <CheckCircle size={18} /> : <Calendar size={18}/>}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
            {isEquipment ? 'Condition' : 'Expiration'}
          </span>
          <span className="font-bold text-slate-700">
            {isEquipment ? 'New / Durable' : (lot.expiry_date ? formatDate(lot.expiry_date) : 'N/A')}
          </span>
        </div>
      </div>

      {/* 3. Price and Stock */}
      <div className="col-span-6 md:col-span-3 text-right md:text-left flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">Unit Price</span>
        <span className="font-black text-blue-700 text-lg">
            {hasPrice ? formatCurrency(price) : <span className="text-slate-400 italic text-sm font-bold">Quote Req.</span>}
        </span>
        <span className={`text-[10px] mt-0.5 font-bold ${hasStock ? 'text-green-600' : (hasPrice ? 'text-amber-500' : 'text-blue-600')}`}>
            {hasStock ? `Stock: ${lot.quantity} pcs` : (hasPrice ? 'Low Stock' : 'Check availability')}
        </span>
      </div>

      {/* 4. Action Controls (SMART) */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-2">
        {renderLotActions()}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface ClientProductCardProps {
  product: Product;
  filterStatus?: string;
}

export const ClientProductCard = ({ product, filterStatus = 'all' }: ClientProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteContext, setQuoteContext] = useState<QuoteContext | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const { addToCart, isAdding } = useCart();
  const { addToWishlist, removeFromWishlist, useWishlistStatus } = useWishlist();
  
  const { data: isInWishlist } = useWishlistStatus(product.id);
  const { lots, isLoadingLots } = useProductDetails(product.id, isExpanded, filterStatus);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasActiveLots = product.active_lots && product.active_lots > 0;
  
  // ✅ VARIABLES SEGURAS DE PRECIO (Para evitar errores TypeScript de undefined)
  const minPrice = product.min_price ? Number(product.min_price) : 0;
  const maxPrice = product.max_price ? Number(product.max_price) : 0;
  const hasReferencePrice = minPrice > 0;
  
  const handleOpenQuote = (context?: QuoteContext) => {
    setQuoteContext(context);
    setIsQuoteOpen(true);
  };

  const handleNavigateToProduct = () => {
    router.push(`/products/${product.id}`);
  };

  const handleMainAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasActiveLots) {
        setIsExpanded(!isExpanded);
    } else {
        if (hasReferencePrice) {
            handleOpenQuote({
                referencePrice: minPrice,
            });
        } else {
            handleOpenQuote();
        }
    }
  };

  const handleAddToCart = async (lotId: string, quantity: number, redirect: boolean = false) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await addToCart({ lotId, quantity });
      if (redirect) router.push('/checkout');
    } catch (error) {
      console.error("Error adding to cart", error);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isInWishlist) await removeFromWishlist(product.id);
    else await addToWishlist(product.id);
  };

  return (
    <>
      <div className={`
        relative w-full bg-white rounded-2xl border transition-all duration-300 overflow-hidden group/card
        ${isExpanded ? 'shadow-xl border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-gray-100 hover:shadow-md'}
      `}>
        
        <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
          
          {/* IMAGE + WISHLIST BUTTON */}
          <div className="relative w-full md:w-32 h-32 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
             <div 
               onClick={handleNavigateToProduct} 
               className="w-full h-full p-2 cursor-pointer bg-white"
             >
                <img 
                  src={getImageUrl(product.primary_image)} 
                  alt={product.description}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover/card:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";
                  }}
                />
             </div>

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
          <div className="flex-1 w-full text-center md:text-left cursor-pointer" onClick={handleNavigateToProduct}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-2 mb-1.5">
              {product.manufacturer_name || "Generic Manufacturer"}
            </div>

            <h3 className="text-lg font-bold text-gray-800 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
              {product.description}
            </h3>

            {/* ✅ MOSTRAR NOTAS / INCLUYE (TRUNCADO) */}
            {product.notes && (
              <div className="mt-2 mb-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <FileText size={10} /> Includes / Notes
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {product.notes}
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-500 mt-2">
               <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
                 SKU: {product.global_sku || 'N/A'}
               </span>
               
               {mounted && (
                   hasActiveLots ? (
                     <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] border border-emerald-100">
                       <Package size={12} /> {product.active_lots} Lots available
                     </span>
                   ) : (
                     <span className="flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full text-[10px] border border-blue-100">
                       <Info size={12} /> {hasReferencePrice ? "Available on request" : "Check Availability"}
                     </span>
                   )
               )}
            </div>
          </div>

          {/* PRICE AND ACTION */}
          <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-4 md:gap-1 pl-0 md:pl-6 md:border-l border-gray-100 min-w-[160px]">
            <div className="text-right w-full">
               {mounted && (
                 <>
                   {hasActiveLots ? (
                     <>
                        <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-bold">Unit Price</p>
                        {minPrice === maxPrice && minPrice > 0 ? (
                           <p className="text-xl font-black text-blue-600">{formatCurrency(minPrice)}</p>
                        ) : minPrice > 0 ? (
                          <div className="flex flex-col items-end">
                            <p className="text-[10px] text-gray-500 font-medium">From</p>
                            <p className="text-lg font-black text-blue-600">{formatCurrency(minPrice)}</p>
                          </div>
                        ) : (
                            <p className="text-xs font-bold text-gray-400 italic">Get Quote</p>
                        )}
                     </>
                   ) : (
                     <>
                        {hasReferencePrice ? (
                            <div className="flex flex-col items-end">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Reference Price</p>
                                <p className="text-lg font-bold text-gray-500">{formatCurrency(minPrice)}</p>
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-gray-400 italic bg-gray-50 px-2 py-1 rounded">
                                Price on request
                            </p>
                        )}
                     </>
                   )}
                 </>
               )}
            </div>
            
            <button 
              onClick={handleMainAction}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wide
              ${isExpanded 
                 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                 : hasActiveLots 
                   ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-900/10' 
                   : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50' 
               }`}
            >
              {isExpanded ? (
                  <>Close <ChevronUp size={14} /></>
              ) : hasActiveLots ? (
                  <>View Options <ChevronDown size={14} /></>
              ) : (
                  <>Request Quote <FileText size={14} /></>
              )}
            </button>
          </div>
        </div>

        {/* === EXPANDABLE AREA (LOT LIST) === */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-slate-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-4 px-1">
                <h4 className="text-sm font-black text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <Package className="text-blue-500" size={16}/> 
                  {filterStatus !== 'all' 
                    ? `Filtered Inventory (${filterStatus === 'expired' ? 'Expired' : 'Near Expiry'})` 
                    : 'Select a lot'}
                </h4>
                <button 
                  onClick={() => handleOpenQuote()}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText size={12}/> Custom Quote
                </button>
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
                      // ✅ AQUI INYECTAMOS EL STATUS PARA QUE QUOTE MODAL SEPA SI ES EQUIPMENT
                      onQuote={(loteData) => handleOpenQuote({
                          lotId: loteData.id,
                          lotNumber: loteData.lot_number,
                          referencePrice: parseFloat(loteData.price),
                          expiryDate: loteData.expiry_date,
                          stockAvailable: loteData.quantity,
                          status: loteData.status 
                      })}
                    />
                  ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="text-amber-400" size={24} />
                  </div>
                  <p className="text-slate-600 font-bold text-sm mb-1">Temporarily out of stock</p>
                  <p className="text-slate-400 text-xs mb-4">No lots available under this criteria.</p>
                  <button 
                    onClick={() => handleOpenQuote()}
                    className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg text-xs transition-colors border border-blue-100"
                  >
                    Request product search
                  </button>
                </div>
            )}
          </div>
        )}
      </div>
      
      <QuoteModal 
        isOpen={isQuoteOpen}
        onClose={() => {
            setIsQuoteOpen(false);
            setQuoteContext(undefined);
        }}
        product={product}
        initialContext={quoteContext}
      />
    </>
  );
};