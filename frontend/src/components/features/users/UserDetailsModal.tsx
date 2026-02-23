// frontend/src/components/features/users/UserDetailsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, MapPin, ShoppingCart, MessageSquareQuote, FileText, Loader2, Building, Phone, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface UserDetailsModalProps {
  userId: string;
  onClose: () => void;
}

export const UserDetailsModal = ({ userId, onClose }: UserDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'quotes'>('profile');
  const [userData, setUserData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 1. Prevent hydration errors (SSR)
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // 2. Load complete data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // User data
        const userRes = await api.get(`/users/${userId}`);
        setUserData(userRes.data);

        // Try to load orders (if fails, empty array)
        try {
           const ordersRes = await api.get(`/orders`); 
           // Filter manually on frontend for now
           const userOrders = ordersRes.data.filter((o: any) => o.customer_id === userId);
           setOrders(userOrders);
        } catch (e) { console.log('No orders found'); }

        // Try to load quotes
        try {
           const quotesRes = await api.get(`/quotes`);
           const userQuotes = quotesRes.data.filter((q: any) => q.user_id === userId);
           setQuotes(userQuotes);
        } catch (e) { console.log('No quotes found'); }

      } catch (error) {
        console.error("Error fetching details", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  if (!userId || !mounted) return null;

  // Render directly using createPortal
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <User className="text-blue-400" /> Client Profile
            </h2>
            <p className="text-slate-400 text-sm mt-1 ml-9">360° Full View</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-100 px-8 bg-slate-50 shrink-0">
          {[
            { id: 'profile', label: 'General Information', icon: <FileText size={16}/> },
            { id: 'orders', label: `Orders (${orders.length})`, icon: <ShoppingCart size={16}/> },
            { id: 'quotes', label: `Quotes (${quotes.length})`, icon: <MessageSquareQuote size={16}/> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-4 transition-all ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
          ) : (
            <>
              {/* === TAB 1: PROFILE === */}
              {activeTab === 'profile' && userData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Account Data */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2">Account Data</h3>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black">
                          {userData.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{userData.full_name}</p>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase">
                            {userData.verification_level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-slate-600">
                          <Mail size={18} className="text-slate-400"/>
                          <span className="text-sm font-medium">{userData.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Phone size={18} className="text-slate-400"/>
                          <span className="text-sm font-medium">{userData.phone || 'No phone number'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Building size={18} className="text-slate-400"/>
                          <span className="text-sm font-medium">{userData.company_name || 'Individual'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fiscal Data & Address */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2">Fiscal Data & Address</h3>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">RFC / Tax ID</p>
                        <p className="font-mono font-bold text-slate-700 text-lg">{userData.tax_id || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Main Address</p>
                        {userData.addresses && userData.addresses.length > 0 ? (
                          <div className="flex items-start gap-3 text-slate-600 text-sm bg-white p-4 rounded-xl border border-slate-200">
                            <MapPin size={20} className="text-blue-500 shrink-0 mt-0.5"/>
                            <div>
                              <p className="font-bold text-slate-800">{userData.addresses[0].street} #{userData.addresses[0].street_number}</p>
                              <p>Col. {userData.addresses[0].colony}</p>
                              <p>{userData.addresses[0].city}, {userData.addresses[0].state}</p>
                              <p className="text-xs mt-1 font-bold text-slate-400">ZIP Code: {userData.addresses[0].postal_code}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">No address registered.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 2: ORDERS === */}
              {activeTab === 'orders' && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orders.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No registered orders</td></tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id} className="bg-white hover:bg-blue-50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-700">#{order.id.slice(0,8)}</td>
                            <td className="px-6 py-4 text-slate-600">{formatDate(order.placed_at)}</td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{order.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-800">{formatCurrency(order.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* === TAB 3: QUOTES === */}
              {activeTab === 'quotes' && (
                <div className="grid gap-4">
                  {quotes.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl text-slate-400">No registered quotes</div>
                  ) : (
                    quotes.map(quote => (
                      <div key={quote.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Request #{quote.id}</p>
                          <p className="text-xs text-slate-500">{formatDate(quote.created_at)}</p>
                        </div>
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                          {quote.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};