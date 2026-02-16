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
  const staffRoles = ['admin', 'sales_agent'];
  
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
  const isAuthRoute = ['/login', '/register', '/forgot-password'].some(route => pathname.startsWith(route));

  // --- LÓGICA DE REDIRECCIÓN ---

  // CASO A: Usuario YA LOGUEADO intentando entrar a Login o Registro
  // Si ya tiene token, lo mandamos a su lugar correspondiente
  if (isAuthRoute && token) {
    if (staffRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CASO B: Rutas de DASHBOARD (Privilegiadas)
  if (isDashboardRoute) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Si tiene token pero no es staff, fuera de aquí
    if (!staffRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/', request.url));
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