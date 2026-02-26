//frontend/src/app/dashboard/traffic/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Activity, Users, Globe, Eye, Clock, 
  MapPin, Package, RefreshCw, Zap
} from 'lucide-react';

// --- INTERFACES ---
interface TrafficStats {
  live_users: number;
  daily_users: number;
  top_countries: { country: string; country_code: string; visitors: string }[];
  top_products: { id: string; description: string; global_sku: string; views: string }[];
}

export default function TrafficPage() {
  // Consulta a la API con Tanstack Query (se refresca sola en background o manual)
  const { data, isLoading, isFetching, refetch } = useQuery<TrafficStats>({
    queryKey: ['traffic-stats'],
    queryFn: async () => {
      const res = await api.get('/traffic/stats');
      return res.data.data;
    },
    // Refrescar automáticamente cada 30 segundos para ver "Live Users" cambiar
    refetchInterval: 30000, 
  });

  const maxProductViews = data?.top_products.length 
    ? Math.max(...data.top_products.map(p => parseInt(p.views))) 
    : 1;

  const maxCountryVisitors = data?.top_countries.length 
    ? Math.max(...data.top_countries.map(c => parseInt(c.visitors))) 
    : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 🚀 HEADER SECTION - ADN MEDBAY ELITE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Live Telemetry
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Traffic Control</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">
            Real-time site analytics and product interest.
          </p>
        </div>

        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:border-slate-900 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Scanning...' : 'Manual Scan'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
           <div className="h-40 bg-slate-200 animate-pulse rounded-[2rem]"></div>
           <div className="h-40 bg-slate-200 animate-pulse rounded-[2rem]"></div>
           <div className="h-96 bg-slate-200 animate-pulse rounded-[2rem]"></div>
           <div className="h-96 bg-slate-200 animate-pulse rounded-[2rem]"></div>
        </div>
      ) : (
        <>
          {/* 📊 TOP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            
            {/* LIVE USERS CARD */}
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden flex items-center justify-between">
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <Users size={180} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <Zap size={12} /> Active Right Now
                </h3>
                <div className="text-6xl md:text-7xl font-black text-white tracking-tighter">
                  {data?.live_users || 0}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  Users on site (Last 5 mins)
                </p>
              </div>
            </div>

            {/* DAILY USERS CARD */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-10 shadow-sm relative overflow-hidden flex items-center justify-between">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <Clock size={12} /> 24 Hour Pulse
                </h3>
                <div className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                  {data?.daily_users || 0}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  Total unique visits today
                </p>
              </div>
            </div>

          </div>

          {/* 🗺️ DEMOGRAPHICS & PRODUCTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TOP PRODUCTS HEATMAP */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Trending Assets</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Most viewed (7 Days)</p>
                </div>
              </div>

              {data?.top_products && data.top_products.length > 0 ? (
                <div className="space-y-6">
                  {data.top_products.map((product, idx) => {
                    const views = parseInt(product.views);
                    const percentage = (views / maxProductViews) * 100;
                    
                    return (
                      <div key={product.id} className="relative">
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-sm font-black text-slate-800 truncate" title={product.description}>
                              {idx + 1}. {product.description}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                              {product.global_sku || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-blue-600">{views}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Views</span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <Package size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No product data yet</p>
                </div>
              )}
            </div>

            {/* TOP COUNTRIES */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Global Reach</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top origins (30 Days)</p>
                </div>
              </div>

              {data?.top_countries && data.top_countries.length > 0 ? (
                <div className="space-y-6">
                  {data.top_countries.map((country, idx) => {
                    const visitors = parseInt(country.visitors);
                    const percentage = (visitors / maxCountryVisitors) * 100;
                    
                    return (
                      <div key={country.country} className="relative">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{country.country_code !== 'XX' ? getFlagEmoji(country.country_code) : '🌍'}</span>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                              {country.country}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-slate-900">{visitors}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Sessions</span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <MapPin size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting connections</p>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// Utilidad para convertir "US" en emoji de bandera (👩‍💻)
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}