import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function MasterDataPage() {
  const modules = [
    {
      title: 'Países',
      description: 'Gestiona los países donde opera MedBay y sus reglas fiscales',
      href: '/dashboard/master-data/countries',
      icon: '🇺🇸',
      count: 'Configuración global',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Monedas',
      description: 'Administra las monedas soportadas para precios y conversiones',
      href: '/dashboard/master-data/currencies',
      icon: '💰',
      count: 'Soporte multi-moneda',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Códigos Fiscales',
      description: 'Configura los códigos de impuestos para integración con Avalara',
      href: '/dashboard/master-data/tax-codes',
      icon: '📑',
      count: 'Cumplimiento tributario',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Datos Maestros</h1>
          <p className="text-gray-600 mt-2">
            Gestiona la información de referencia global del sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href} className="block">
            <Card className={`cursor-pointer transition-all hover:shadow-md ${module.color} border-2 h-full`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl">{module.icon}</div>
                  <div className="text-xs bg-white px-2 py-1 rounded-full border">
                    {module.count}
                  </div>
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <p className="text-sm text-gray-600">
                  {module.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-blue-600 font-medium">
                  Gestionar →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border">
        <h3 className="font-semibold text-lg mb-2">💡 Información importante</h3>
        <p className="text-gray-600 text-sm">
          Los datos maestros son información de referencia que se utiliza en todo el sistema. 
          Una vez configurados, estarán disponibles en formularios de productos, proveedores, fabricantes, etc.
        </p>
      </div>
    </div>
  );
}