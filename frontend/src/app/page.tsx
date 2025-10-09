import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">MedBay</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-blue-600">Características</Link>
              <Link href="#about" className="text-gray-600 hover:text-blue-600">Nosotros</Link>
              <Link href="#contact" className="text-gray-600 hover:text-blue-600">Contacto</Link>
            </nav>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Marketplace Especializado en 
          <span className="text-blue-600"> Insumos Médicos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Conectamos proveedores con hospitales, clínicas y profesionales de la salud. 
          Plataforma B2B con cumplimiento normativo integrado.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register?type=supplier"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
          >
            Soy Proveedor
          </Link>
          <Link
            href="/register?type=buyer"
            className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
          >
            Soy Comprador
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características Principales
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Catálogo Centralizado</h3>
              <p className="text-gray-600">
                Miles de productos médicos de múltiples proveedores en un solo lugar
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cumplimiento Normativo</h3>
              <p className="text-gray-600">
                Revisión humana para productos que requieren licencias o recetas médicas
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Importación Masiva</h3>
              <p className="text-gray-600">
                Sube archivos Excel con inventario y nuestro sistema lo procesa automáticamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para unirte a MedBay?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Regístrate hoy y comienza a conectar con la comunidad médica
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 MedBay. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}