//frontend/src/app/(shop)/quotes/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Package, Calendar, ChevronRight, MessageSquareQuote, 
  Search, Filter, ExternalLink, FileText, CheckCircle2, Clock, XCircle 
} from 'lucide-react';
import { useCustomerQuotes, CustomerQuote } from '@/hooks/useCustomerQuotes';
import { formatDate } from '@/lib/formatters';
import CustomerQuoteModal from './components/CustomerQuoteModal';

export default function CustomerQuotesPage() {
  const { quotes, isLoading, respondToQuote, isResponding, getStatusInfo } = useCustomerQuotes();
  const [selectedQuote, setSelectedQuote] = useState<CustomerQuote | null>(null);
  const [filter, setFilter] = useState('all'); // all | active | history

  // Lógica de Respuesta (Intacta)
  const handleRespond = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      await respondToQuote({ id, action });
      setSelectedQuote(null);
    } catch (error) {
      console.error("Error al responder:", error);
    }
  };

  // Filtrado simple (Intacto)
  const filteredQuotes = quotes.filter(q => {
    if (filter === 'active') return ['pending', 'proposal_sent'].includes(q.status);
    if (filter === 'history') return ['accepted', 'rejected', 'converted_to_order'].includes(q.status);
    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-20 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* HEADER DE SECCIÓN */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                 <MessageSquareQuote size={24} />
               </div>
               <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Gestión de Compras</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Cotizaciones</h1>
            <p className="text-slate-500 mt-2 font-medium text-lg max-w-xl">
              Administra tus solicitudes de productos especiales y revisa las propuestas comerciales.
            </p>
          </div>

          <Link 
            href="/products" 
            className="group px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-3"
          >
            <Search size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> 
            <span>Buscar Nuevo Producto</span>
          </Link>
        </div>

        {/* TABS DE FILTRO */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'active', label: 'En Proceso' },
            { id: 'history', label: 'Historial' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap border
                ${filter === tab.id 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                  : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LISTA DE COTIZACIONES */}
        <div className="space-y-6">
          {isLoading ? (
            // Skeleton Loading Premium
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse h-40"></div>
            ))
          ) : filteredQuotes.length === 0 ? (
            // Empty State Premium
            <div className="bg-white rounded-[3rem] p-16 text-center border border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Package size={48} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">No tienes cotizaciones</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                ¿Buscas un producto específico o un lote grande? Solicita una cotización directamente desde nuestro catálogo.
              </p>
              <Link 
                href="/products" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
              >
                Ir al Catálogo <ChevronRight size={20} />
              </Link>
            </div>
          ) : (
            filteredQuotes.map((quote) => {
              const status = getStatusInfo(quote.status);
              
              return (
                <div 
                  key={quote.id} 
                  className="group bg-white p-1 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    
                    {/* INFO PRINCIPAL */}
                    <div className="flex items-start gap-6 flex-1 w-full">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all flex-shrink-0">
                        <FileText size={32} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${status.color}`}>
                            {quote.status === 'pending' && <Clock size={12} />}
                            {quote.status === 'proposal_sent' && <CheckCircle2 size={12} />}
                            {quote.status === 'rejected' && <XCircle size={12} />}
                            {status.label}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <Calendar size={12} /> {formatDate(quote.created_at)}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight mb-1">
                          {quote.product_request.product_name}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                           <span>Cant: <strong className="text-slate-800">{quote.product_request.quantity_asked} pzas</strong></span>
                           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                           <span className="font-mono text-slate-400">SKU: {quote.product_request.sku}</span>
                        </div>
                      </div>
                    </div>

                    {/* ACCIONES */}
                    <div className="w-full md:w-auto flex flex-col items-end gap-3 min-w-[180px]">
                      
                      {/* Caso 1: Propuesta Lista (Botón Principal con pulso) */}
                      {status.actionRequired ? (
                        <button 
                          onClick={() => setSelectedQuote(quote)}
                          className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 group-hover:scale-105"
                        >
                          Ver Propuesta <ExternalLink size={18} />
                        </button>
                      ) : (
                        // Caso 2: Solo ver detalles (Read Only)
                        <button 
                          onClick={() => setSelectedQuote(quote)} 
                          className="w-full bg-white border-2 border-slate-100 text-slate-500 px-6 py-3.5 rounded-xl font-bold hover:border-slate-300 hover:text-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          Ver Detalles <ChevronRight size={18} />
                        </button>
                      )}
                      
                      {status.actionRequired && (
                         <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">
                           ¡Acción requerida!
                         </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL (Se abre al seleccionar una cotización) */}
        <CustomerQuoteModal 
          isOpen={!!selectedQuote}
          onClose={() => setSelectedQuote(null)}
          quote={selectedQuote}
          onRespond={handleRespond}
          isResponding={isResponding}
        />

      </div>
    </div>
  );
}