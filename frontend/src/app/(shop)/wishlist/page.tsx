//frontend/src/app/(shop)/wishlist/page.tsx

"use client";

import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { getImageUrl } from "@/lib/formatters";
import { 
  Trash2, ShoppingBag, Heart, ArrowRight, 
  PackageOpen, ShoppingCart, ShieldCheck, ChevronRight 
} from "lucide-react";

export default function WishlistPage() {
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-slate-200 rounded-full animate-ping opacity-75"></div>
          <div className="h-4 w-40 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden flex flex-col">
      {/* ======= MAIN CONTENT ======= */}
      <main className="flex-grow w-[90%] max-w-[1400px] mx-auto py-12">
        
        {wishlistItems.length === 0 ? (
          /* --- EMPTY STATE --- */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 mb-8 border border-slate-100">
              <Heart size={48} className="text-slate-300 ml-1 mt-1" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Tu lista de deseos está vacía</h1>
            <p className="text-slate-500 mb-10 max-w-md text-lg leading-relaxed font-medium">
              Guarda los productos que te interesan para monitorear su stock o comprarlos más tarde.
            </p>
            <Link 
              href="/products" 
              className="group bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3"
            >
              Ir al Catálogo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          /* --- GRID DE FAVORITOS --- */
          <>
            <div className="flex items-center justify-between mb-8">
               <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <Heart className="text-red-500 fill-current" size={32} /> Lista de Deseos
               </h1>
               <span className="bg-white px-4 py-1.5 rounded-full text-xs font-black text-slate-500 border border-slate-200 shadow-sm uppercase tracking-wide">
                 {wishlistItems.length} Productos Guardados
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {wishlistItems.map((item) => {
                const hasStock = parseInt(item.total_stock) > 0;

                return (
                  <div 
                    key={item.wishlist_item_id} 
                    className="group bg-white rounded-[2rem] border border-white shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    {/* Imagen */}
                    <div className="relative h-56 bg-slate-50 p-8 flex items-center justify-center border-b border-slate-50 group-hover:bg-white transition-colors">
                      <img 
                        src={getImageUrl(item.product_image)} 
                        alt={item.product_name} 
                        className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => e.currentTarget.src = getImageUrl(null)}
                      />
                      <button 
                        onClick={() => removeFromWishlist(item.product_id)}
                        className="absolute top-4 right-4 p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-90"
                        title="Quitar de favoritos"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Contenido */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4 flex-1">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                          {item.manufacturer_name}
                        </p>
                        <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-2 mb-3 group-hover:text-blue-700 transition-colors">
                          <Link href={`/products/${item.product_id}`}>
                            {item.product_name}
                          </Link>
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          SKU: {item.global_sku}
                        </span>
                      </div>

                      {/* Stock Status */}
                      <div className="mb-6">
                        {hasStock ? (
                          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                            <PackageOpen size={14} /> 
                            <span>En Stock ({item.total_stock})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 w-fit">
                            <PackageOpen size={14} /> 
                            <span>Agotado temporalmente</span>
                          </div>
                        )}
                      </div>

                      {/* Botón de Acción */}
                      <Link 
                        href={`/products?search=${item.global_sku}`} 
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group-hover:shadow-blue-600/20"
                      >
                        <ShoppingBag size={16} /> Ver Opciones
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}