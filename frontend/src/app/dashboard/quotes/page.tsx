//frontend/src/app/dashboard/quotes/page.tsx
"use client";

import { useState } from "react";
import { 
  Search, Filter, MessageSquareQuote, AlertCircle, 
  CheckCircle2, Clock, Send, XCircle, Eye 
} from "lucide-react";
import { useAdminQuotes, Quote } from "@/hooks/useAdminQuotes";
import { formatDate } from "@/lib/formatters";
import QuoteResponseModal from "./QuoteResponseModal";

export default function QuotesPage() {
  const { quotes, isLoading, getStatusLabel, getStatusColor } = useAdminQuotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal State
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // --- FILTERS ---
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      (quote.product_request.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
      (quote.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
      (quote.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || "");
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- QUICK STATS ---
  const pendingCount = quotes.filter(q => q.status === 'pending').length;
  const acceptedCount = quotes.filter(q => q.status === 'accepted').length;

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quote Requests</h1>
          <p className="text-slate-500 text-sm">Manage inventory inquiries and send proposals.</p>
        </div>
        
        {/* ACTION ALERTS */}
        <div className="flex gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm animate-pulse">
              <AlertCircle size={18} />
              <span className="text-xs font-bold">{pendingCount} pending response</span>
            </div>
          )}
          {acceptedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm">
              <CheckCircle2 size={18} />
              <span className="text-xs font-bold">{acceptedCount} accepted (Close Sale)</span>
            </div>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by product, customer, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter size={18} className="text-slate-400 flex-shrink-0" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">🟡 Pending</option>
            <option value="proposal_sent">🔵 Sent</option>
            <option value="accepted">🟢 Accepted</option>
            <option value="rejected">🔴 Rejected</option>
          </select>
        </div>
      </div>

      {/* QUOTES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Requested Product</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // SKELETON LOADING
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-b border-slate-50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <MessageSquareQuote size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No quotes found</p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    
                    {/* DATE */}
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {formatDate(quote.created_at)}
                      <div className="font-mono mt-1 text-[10px] opacity-60">#{quote.id.slice(0,6)}</div>
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {quote.user_name || quote.guest_info?.name || "Guest"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {quote.user_email || quote.guest_info?.email}
                      </div>
                    </td>

                    {/* PRODUCT */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{quote.product_request.product_name}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">
                          SKU: {quote.product_request.sku}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Qty: {quote.product_request.quantity_asked}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(quote.status)}`}>
                        {getStatusLabel(quote.status)}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-center">
                      {quote.status === 'pending' ? (
                        <button 
                          onClick={() => setSelectedQuote(quote)}
                          className="bg-slate-900 text-white hover:bg-blue-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-md shadow-slate-900/10"
                        >
                          <Send size={14}/> Reply
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedQuote(quote)} 
                          className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-colors mx-auto"
                          title="View Details"
                        >
                          <Eye size={18}/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESPONSE MODAL */}
      {selectedQuote && (
        <QuoteResponseModal 
          isOpen={!!selectedQuote}
          onClose={() => setSelectedQuote(null)}
          quote={selectedQuote}
        />
      )}

    </div>
  );
}