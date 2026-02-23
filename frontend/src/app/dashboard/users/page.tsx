// frontend/src/app/dashboard/users/page.tsx
"use client";

import { useState } from "react";
import { Users, Briefcase, UserCheck } from "lucide-react";
import { ClientsTable } from "@/components/features/users/ClientsTable";
import { CollaboratorsTable } from "@/components/features/users/CollaboratorsTable";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'clients' | 'collaborators'>('clients');

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              User Management
            </h1>
            <p className="text-slate-500 font-medium">
              Manage clients, validate accounts, and manage your sales team.
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 inline-flex shadow-sm">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'clients'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <UserCheck size={18} />
            Clients
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'collaborators'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Briefcase size={18} />
            Collaborators
          </button>
        </div>

        {/* DYNAMIC CONTENT */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'clients' ? (
            <ClientsTable />
          ) : (
            <CollaboratorsTable />
          )}
        </div>

      </div>
    </div>
  );
}