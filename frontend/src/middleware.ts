// frontend/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. DEFINICIÓN DE ROLES Y RUTAS
  
  // Roles que tienen acceso al Dashboard
  const staffRoles = ['admin', 'sales_agent'];

  // Rutas exclusivas de Staff (Admin y Vendedores)
  // Usamos startsWith para proteger sub-rutas (ej: /dashboard/settings)
  const isDashboardRoute = path.startsWith('/dashboard') || path.startsWith('/admin');

  // Rutas que requieren estar LOGUEADO (Cualquier rol: Cliente o Staff)
  const protectedRoutes = [
    '/cart', 
    '/checkout', 
    '/profile', 
    '/orders', 
    '/wishlist', 
    '/quotes'
  ];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // Rutas de AUTENTICACIÓN (Login/Registro)
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));

  // 2. OBTENER CREDENCIALES
  // Gracias al fix anterior en useApi.ts (path: '/'), estas cookies AHORA SÍ son visibles en todas las rutas.
  const token = request.cookies.get('medbay_token')?.value;
  const userRole = request.cookies.get('medbay_role')?.value; 

  // --- LÓGICA DE CONTROL DE TRÁFICO ---

  // CASO A: Usuario YA LOGUEADO intenta entrar a Login/Registro
  // (Evitamos que se vuelvan a loguear si ya tienen sesión)
  if (isAuthRoute && token) {
    // Si es Staff (Admin o Vendedor) -> Al Dashboard
    if (staffRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si es Cliente (Cualquier otro rol) -> Al Home
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CASO B: Rutas de DASHBOARD (Admin + Vendedores)
  if (isDashboardRoute) {
    // 1. Si no hay token -> Login
    if (!token) {
      // Guardamos la URL a la que querían ir para redirigirlos después (opcional, pero buena práctica)
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    
    // 2. Si hay token pero NO es Staff -> Home (Acceso Denegado)
    // Esto evita que un cliente normal vea el panel de administración
    if (!staffRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // CASO C: Rutas PROTEGIDAS (Carrito, Perfil, etc.)
  if (isProtectedRoute) {
    // Si no hay token -> Login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', path); // Para regresar al usuario a donde iba
      return NextResponse.redirect(url);
    }
    // Si hay token, Pasa.
  }

  // CASO D: Rutas PÚBLICAS (Home, Catálogo, Contacto)
  // El middleware deja pasar. El frontend decidirá qué mostrar (precios o "inicia sesión").
  
  return NextResponse.next();
}

// Configuración: En qué rutas se ejecuta este middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api (backend)
     * 2. /_next (nextjs internals)
     * 3. /static (public assets)
     * 4. Archivos con extensión (imágenes, favicon, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};