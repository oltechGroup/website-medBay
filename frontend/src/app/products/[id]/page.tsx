"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Package, Calendar, ShoppingCart, 
  FileText, AlertCircle, Info, Heart, ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; 
import { getImageUrl, formatCurrency, formatDate, getLotStatusConfig } from "@/lib/formatters";
import { useProductDetails } from "@/hooks/useProductDetails"; 
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import QuoteModal, { QuoteContext } from "@/components/features/products/client/QuoteModal";
import { api } from "@/lib/api";

// --- SUB-COMPONENTE: LOTE ---
interface LotItemProps {
  lot: any;
  onAddToCart: (lotId: string, quantity: number, redirect?: boolean) => Promise<void>;
  isAdding: boolean;
  onQuote: (lot: any) => void;
}

const LotItem = ({ lot, onAddToCart, isAdding, onQuote }: LotItemProps) => {
  const [quantity, setQuantity] = useState(1);
  const config = getLotStatusConfig(lot.status, lot.expiry_date);
  const price = lot.discount_price_amount || lot.price_amount || lot.price;
  
  const hasPrice = price && parseFloat(price) > 0;
  const hasStock = lot.quantity > 0;

  return (
    <div className="border-2 border-slate-100 rounded-2xl p-5 hover:border-blue-300 hover:shadow-xl transition-all bg-white group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color}`}>
              {config.label}
          </span>
          <p className="text-xs text-slate-400 mt-3 font-mono flex items-center gap-1.5">
            <Package size={14}/> Lot: <span className="text-slate-700 font-bold">{lot.lot_number}</span>
          </p>
        </div>
        <div className="text-right">
           <p className="text-2xl font-black text-blue-600">
             {hasPrice ? formatCurrency(price) : <span className="text-slate-400 text-sm italic">Get Quote</span>}
           </p>
           <p className={`text-[10px] uppercase font-bold tracking-wide mt-1 ${hasStock ? 'text-slate-400' : 'text-blue-600'}`}>
             {hasStock ? `Available: ${lot.quantity}` : 'On Request'}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <Calendar size={16} className="text-blue-500"/> 
        <span className="font-medium">Expires: <strong className="text-slate-800 ml-1">{formatDate(lot.expiry_date)}</strong></span>
      </div>

      <div className="flex flex-col gap-3">
        {hasPrice && hasStock ? (
          <>
            <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
               <QuantitySelector 
                 quantity={quantity}
                 max={lot.quantity}
                 onIncrease={() => setQuantity(q => q + 1)}
                 onDecrease={() => setQuantity(q => q - 1)}
                 disabled={isAdding}
                 size="sm"
               />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onAddToCart(lot.id, quantity, false)}
                disabled={isAdding}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-black uppercase tracking-wide hover:bg-slate-200 hover:text-blue-600 transition-colors text-[10px] active:scale-95"
              >
                <ShoppingCart size={16}/> Add to Cart
              </button>
              <button 
                onClick={() => onAddToCart(lot.id, quantity, true)}
                disabled={isAdding}
                className="bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-wide hover:bg-blue-700 transition-colors text-[10px] shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Buy Now
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={() => onQuote(lot)}
            className="w-full bg-white border-2 border-blue-100 text-blue-600 py-3 rounded-xl font-black uppercase tracking-wide hover:bg-blue-50 transition-colors text-[10px] flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <FileText size={16}/> Request Quote
          </button>
        )}
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loadingBase, setLoadingBase] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false); 
  const [quoteContext, setQuoteContext] = useState<QuoteContext | undefined>(undefined);

  const { isAuthenticated } = useAuth();
  const { addToCart, isAdding } = useCart();
  const { addToWishlist, removeFromWishlist, useWishlistStatus } = useWishlist();
  
  // Obtenemos si está en favoritos
  const { data: isInWishlist } = useWishlistStatus(productId);

  // Cargamos los detalles (lotes, categorías, imágenes extra)
  const { lots, categories, images, isLoadingDetails } = useProductDetails(productId, true);

  // Cargar el producto base
  useEffect(() => {
    const fetchProductBase = async () => {
      try {
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data);
      } catch (error) {
        console.error("Error loading product", error);
      } finally {
        setLoadingBase(false);
      }
    };
    if (productId) fetchProductBase();
  }, [productId]);

  if (loadingBase) {
    return (
      <div className="min-h-screen bg-slate-50 pt-10 pb-20 flex justify-center">
        <div className="animate-pulse space-y-8 w-full max-w-6xl px-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2 h-[500px] bg-slate-200 rounded-[3rem]"></div>
            <div className="w-full lg:w-1/2 space-y-4">
              <div className="h-12 bg-slate-200 rounded-xl w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              <div className="h-32 bg-slate-200 rounded-2xl mt-10"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <AlertCircle size={48} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-black mb-2">Product not found</h1>
        <button onClick={() => router.push('/products')} className="text-blue-600 font-bold hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    );
  }

  // Lógica de imágenes
  const allImages = [
    { image_url: product.primary_image, id: 'primary' },
    ...images.filter((img: any) => !img.is_primary)
  ];

  const handleNextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  const handlePrevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

  // Lógica de Carrito y Wishlist
  const handleAddToCart = async (lotId: string, quantity: number, redirect: boolean = false) => {
    if (!isAuthenticated) return router.push('/login');
    try {
      await addToCart({ lotId, quantity });
      if (redirect) router.push('/checkout');
    } catch (error) {
      console.error("Error adding to cart", error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) return router.push('/login');
    if (isInWishlist) await removeFromWishlist(product.id);
    else await addToWishlist(product.id);
  };

  const handleOpenQuote = (context?: QuoteContext) => {
    setQuoteContext(context);
    setIsQuoteOpen(true);
  };

  const minPrice = product.min_price ? Number(product.min_price) : 0;
  const hasReferencePrice = minPrice > 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pt-6 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb / Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to previous page
        </button>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
          
          {/* === LEFT COLUMN: IMAGES === */}
          <div className="w-full lg:w-1/2 bg-slate-50/50 p-6 lg:p-12 flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-slate-100 relative">
            
            {/* Wishlist Button Flotante */}
            <button 
              onClick={handleToggleWishlist}
              className={`absolute top-8 right-8 z-10 p-3 rounded-full shadow-md border transition-all hover:scale-105 active:scale-95
                ${isInWishlist ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-300 hover:text-red-400'}`}
            >
              <Heart size={20} className={isInWishlist ? "fill-current" : ""} />
            </button>

            <div className="relative w-full aspect-square max-h-[500px] mb-8 bg-white rounded-[2rem] shadow-sm p-4 flex items-center justify-center border border-white">
              <img 
                src={getImageUrl(allImages[currentImageIndex]?.image_url)} 
                alt={product.description} 
                className="max-w-full max-h-full object-contain mix-blend-multiply"
                onError={(e) => e.currentTarget.src = getImageUrl(null)}
              />
              
              {allImages.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-600 border border-slate-100 hover:bg-blue-50 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-600 border border-slate-100 hover:bg-blue-50 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto py-2 px-1 w-full justify-center no-scrollbar">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all border-2 bg-white
                      ${currentImageIndex === idx ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={getImageUrl(img.image_url)} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* === RIGHT COLUMN: INFO & LOTS === */}
          <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12">
            
            <div className="mb-8">
              <span className="inline-block px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                {product.manufacturer_name || "Generic Manufacturer"}
              </span>
              
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                {product.description}
              </h1>
              
              <div className="flex flex-wrap gap-3">
                  <span className="bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-600">
                    SKU: {product.global_sku}
                  </span>
                  {isAuthenticated && categories.map((cat: any) => (
                    <span key={cat.id} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">
                      {cat.name}
                    </span>
                  ))}
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full mb-10"></div>

            {/* Inventario */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 flex items-center gap-2 text-xl uppercase tracking-tight">
                  <Package className="text-blue-600" size={24}/> Available Inventory
                </h3>
                <button 
                  onClick={() => handleOpenQuote()}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg"
                >
                  <FileText size={14}/> Custom Quote
                </button>
              </div>

              <div className="space-y-4">
                {isLoadingDetails ? (
                    [1,2].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse"></div>)
                ) : lots.length > 0 ? (
                    lots.map((lot: any) => (
                      <LotItem 
                        key={lot.id} lot={lot} onAddToCart={handleAddToCart} isAdding={isAdding}
                        onQuote={(lotData) => handleOpenQuote({
                            lotId: lotData.id, lotNumber: lotData.lot_number,
                            referencePrice: parseFloat(lotData.price),
                            expiryDate: lotData.expiry_date, stockAvailable: lotData.quantity
                        })}
                      />
                    ))
                ) : hasReferencePrice ? (
                    // PRODUCTO SIN STOCK PERO CON PRECIO
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-blue-600">
                        <Info size={32} />
                      </div>
                      <h4 className="text-slate-900 font-black mb-2 text-xl uppercase tracking-tight">Available on Request</h4>
                      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto font-medium">
                        This product is imported upon request.
                      </p>
                      <div className="mb-8 p-4 bg-white rounded-2xl inline-block shadow-sm border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Reference Price</p>
                          <p className="text-3xl font-black text-blue-600">{formatCurrency(product.min_price)}</p>
                      </div>
                      <div className="block">
                          <button 
                            onClick={() => handleOpenQuote({ referencePrice: minPrice })}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                          >
                            Start Order / Quote
                          </button>
                      </div>
                    </div>
                ) : (
                    // PRODUCTO AGOTADO Y SIN PRECIO
                    <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-300">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <AlertCircle className="text-amber-400" size={32} />
                      </div>
                      <h4 className="text-slate-900 font-black mb-2 text-xl uppercase tracking-tight">Product out of stock</h4>
                      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto font-medium">
                        We currently do not have stock or a reference price for this item.
                      </p>
                      <button 
                        onClick={() => handleOpenQuote()}
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                      >
                        Request Search
                      </button>
                    </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <QuoteModal 
        isOpen={isQuoteOpen}
        onClose={() => { setIsQuoteOpen(false); setQuoteContext(undefined); }}
        product={product}
        initialContext={quoteContext}
      />
    </div>
  );
}