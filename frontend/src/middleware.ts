// frontend/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. DEFINICIÓN DE ROLES Y RUTAS
  const staffRoles = ['admin', 'sales_agent'];
  
  // Rutas exclusivas de Dashboard
  const isDashboardRoute = path.startsWith('/dashboard') || path.startsWith('/admin');

  // Rutas que requieren estar LOGUEADO
  const protectedRoutes = [
    '/cart', 
    '/checkout', 
    '/profile', 
    '/orders', 
    '/wishlist', 
    '/quotes'
  ];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // Rutas de Auth
  const isAuthRoute = ['/login', '/register', '/forgot-password'].some(route => path.startsWith(route));

  // 2. OBTENER CREDENCIALES
  const token = request.cookies.get('medbay_token')?.value;
  const userRole = request.cookies.get('medbay_role')?.value; 

  // --- LÓGICA DE CONTROL DE TRÁFICO ---

  // CASO A: Usuario YA LOGUEADO intenta entrar a Registro
  // (Solo bloqueamos registro. PERMITIMOS /login para romper bucles de tokens vencidos)
  if (path.startsWith('/register') && token) {
    if (staffRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CASO B: Rutas de DASHBOARD (Admin + Vendedores)
  if (isDashboardRoute) {
    // 1. Si no hay token -> Login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    
    // 2. Si hay token pero NO es Staff -> Home (Acceso Denegado)
    if (!staffRoles.includes(userRole || '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // CASO C: Rutas PROTEGIDAS (Cliente verificado)
  if (isProtectedRoute) {
    // Si no hay token -> Login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    // Si hay token, PASA. 
    // No redirigimos a ningún lado, dejamos que cargue la página.
  }

  // CASO D: Todo lo demás (Público)
  return NextResponse.next();
}

// Configuración: Excluir estáticos y API interna
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};