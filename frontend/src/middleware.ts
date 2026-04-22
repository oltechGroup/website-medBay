// frontend/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. OBTENER CREDENCIALES
  // Intentamos obtener el token de las cookies
  const token = request.cookies.get('medbay_token')?.value;
  const userRole = request.cookies.get('medbay_role')?.value;

  // 2. DEFINICIÓN DE RUTAS
  // ✅ MODIFICADO: Agregamos 'supplier' a los roles con acceso general al Dashboard
  const dashboardRoles = ['admin', 'sales_agent', 'supplier'];
  
  // Rutas que requieren ser STAFF (Dashboard/Admin)
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  // Rutas que requieren estar LOGUEADO (Clientes)
  const protectedRoutes = [
    '/cart', 
    '/checkout', 
    '/profile', 
    '/orders', 
    '/wishlist', 
    '/quotes'
  ];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Rutas de Autenticación
  // ✅ MODIFICADO: Agregamos '/reset-password' para que los usuarios logueados no puedan entrar aquí
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some(route => pathname.startsWith(route));

  // --- LÓGICA DE REDIRECCIÓN ---

  // CASO A: Usuario YA LOGUEADO intentando entrar a Login o Registro
  if (isAuthRoute && token) {
    // ✅ NUEVO: Si es proveedor, lo mandamos directo a su zona
    if (userRole === 'supplier') {
      return NextResponse.redirect(new URL('/dashboard/import', request.url));
    } 
    // Si es admin/ventas, al dashboard general
    else if (dashboardRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si es cliente, al inicio
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CASO B: Rutas de DASHBOARD (Privilegiadas)
  if (isDashboardRoute) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Si tiene token pero no pertenece a dashboardRoles, fuera de aquí
    if (!dashboardRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ✅ NUEVA REGLA ESTRICTA: El proveedor SOLO puede estar en /dashboard/import
    if (userRole === 'supplier' && !pathname.startsWith('/dashboard/import')) {
      return NextResponse.redirect(new URL('/dashboard/import', request.url));
    }
  }

  // CASO C: Rutas PROTEGIDAS (Carrito, Favoritos, etc.)
  if (isProtectedRoute) {
    if (!token) {
      // Si no hay token, lo mandamos al login pero guardamos a dónde quería ir
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      
      // Creamos la respuesta de redirección
      const response = NextResponse.redirect(url);
      
      // IMPORTANTE: Si por alguna razón había cookies "basura" o mal formadas, 
      // las limpiamos en este rebote para forzar un estado limpio.
      response.cookies.delete('medbay_token');
      response.cookies.delete('medbay_role');
      
      return response;
    }
    // Si hay token, permitimos el paso. 
    // La validación profunda del token la hará la API y el Interceptor que ya corregimos.
  }

  return NextResponse.next();
}

// Configuración del Matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (svg, png, jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};