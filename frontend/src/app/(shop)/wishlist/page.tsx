//frontend/src/app/(shop)/wishlist/page.tsx

"use client";

import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { formatCurrency, getImageUrl } from "@/lib/formatters";
import { Trash2, ShoppingBag, Heart, ArrowRight, PackageOpen } from "lucide-react";

export default function WishlistPage() {
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <Heart size={40} className="text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Tu lista de deseos está vacía</h1>
        <p className="text-slate-500 mb-8 max-w-md text-center">
          Guarda los productos que te interesan para monitorear su stock o comprarlos más tarde.
        </p>
        <Link 
          href="/products" 
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
        >
          Ir al Catálogo <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="w-[95%] max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
             <Heart className="text-red-500 fill-current" /> Lista de Deseos
           </h1>
           <span className="bg-white px-4 py-1 rounded-full text-sm font-bold text-slate-500 border border-slate-200 shadow-sm">
             {wishlistItems.length} Productos guardados
           </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const hasStock = parseInt(item.total_stock) > 0;

            return (
              <div 
                key={item.wishlist_item_id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Imagen */}
                <div className="relative h-48 bg-slate-50 p-6 flex items-center justify-center border-b border-slate-100">
                  <img 
                    src={getImageUrl(item.product_image)} 
                    alt={item.product_name} 
                    className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => e.currentTarget.src = getImageUrl(null)}
                  />
                  <button 
                    onClick={() => removeFromWishlist(item.product_id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors backdrop-blur-sm shadow-sm"
                    title="Quitar de favoritos"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {item.manufacturer_name}
                    </p>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      <Link href={`/products/${item.product_id}`}>
                        {item.product_name}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded">
                      SKU: {item.global_sku}
                    </p>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-5">
                    {hasStock ? (
                      <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-full w-fit">
                        <PackageOpen size={14} /> En Stock ({item.total_stock} pzas)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-full w-fit">
                        <PackageOpen size={14} /> Agotado temporalmente
                      </span>
                    )}
                  </div>

                  {/* Botón de Acción */}
                  <Link 
                    href={`/products?search=${item.global_sku}`} // O link directo al producto
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={16} /> Ver Opciones de Compra
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}