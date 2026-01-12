//frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. DEFINICIÓN DE RUTAS (Zonas de Seguridad)
  
  // Rutas que solo el ADMIN puede ver
  const adminRoutes = ['/dashboard', '/admin'];

  // Rutas que requieren estar LOGUEADO (Cualquier rol: Cliente o Admin)
  const protectedRoutes = [
    '/cart', 
    '/checkout', 
    '/profile', 
    '/orders', 
    '/wishlist', 
    '/quotes'
  ];

  // Rutas de AUTENTICACIÓN (Si ya estás logueado, no deberías verlas)
  const authRoutes = ['/login', '/register', '/forgot-password'];

  // 2. OBTENER CREDENCIALES (Cookies)
  // Nota: El middleware solo puede leer Cookies, no LocalStorage.
  // En el siguiente paso configuraremos el Login para que guarde estas cookies.
  const token = request.cookies.get('medbay_token')?.value;
  const userRole = request.cookies.get('medbay_role')?.value; // 'admin', 'medical_professional', etc.

  // --- LÓGICA DE CONTROL DE TRÁFICO ---

  // CASO A: Usuario intenta entrar a Login/Registro teniendo sesión activa
  if (authRoutes.includes(path) && token) {
    // Si es Admin -> Al Dashboard
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si es Cliente -> Al Home
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CASO B: Rutas de ADMINISTRADOR
  // Si la ruta empieza con /dashboard o /admin
  if (adminRoutes.some(route => path.startsWith(route))) {
    // 1. Si no hay token -> Login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // 2. Si hay token pero NO es admin -> Home (Acceso Denegado)
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // CASO C: Rutas PROTEGIDAS (Cliente verificado)
  // Si intenta entrar a carrito, perfil, etc.
  if (protectedRoutes.some(route => path.startsWith(route))) {
    // Si no hay token -> Login
    if (!token) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      // (Opcional) Podrías guardar la url de retorno aquí
      return response;
    }
    // Si hay token, Pasa (NextResponse.next() es implícito abajo)
  }

  // CASO D: Rutas PÚBLICAS (Home, Catálogo, Contacto)
  // El middleware no hace nada, deja pasar a todos (invitados y logueados).
  // Las restricciones visuales (ocultar precios/lotes) las maneja el componente React.
  
  return NextResponse.next();
}

// Configuración: En qué rutas se ejecuta este middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api (las rutas de backend no las tocamos aquí)
     * 2. /_next (archivos internos de next)
     * 3. /static (imágenes estáticas)
     * 4. Archivos con extensión (favicon.ico, imagenes.png, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};