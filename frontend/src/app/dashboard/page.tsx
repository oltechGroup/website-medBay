//frontend/src/app/dashboard/page.tsx

import InboxSystem from "@/components/features/contact/InboxSystem";

export default function DashboardHome() {
  return (
    <section className="space-y-8">
      {/* Encabezado del Dashboard */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">
          Panel Principal
        </h1>
        <p className="text-slate-500">
          Bienvenido al sistema de gestión de <span className="font-bold text-blue-600">MedBay</span>. 
        </p>
      </div>

      {/* SISTEMA DE NOTIFICACIONES */}
      <div className="mt-8">
         <InboxSystem />
      </div>

    </section>
  );
}