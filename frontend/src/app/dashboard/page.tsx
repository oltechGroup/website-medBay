// frontend/src/app/dashboard/page.tsx

import InboxSystem from "@/components/features/contact/InboxSystem";

export default function DashboardHome() {
  return (
    <section className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">
          Main Dashboard
        </h1>
        <p className="text-slate-500">
          Welcome to the management system for <span className="font-bold text-blue-600">MedBay</span>. 
        </p>
      </div>

      {/* NOTIFICATION SYSTEM */}
      <div className="mt-8">
         <InboxSystem />
      </div>

    </section>
  );
}