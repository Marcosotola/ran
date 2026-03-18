import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected route prefixes and their required roles
const PROTECTED = [
  { prefix: '/admin', roles: ['admin', 'dev'] },
  { prefix: '/finanzas', roles: ['finanzas', 'admin', 'dev'] },
  { prefix: '/contenido', roles: ['contenido', 'admin', 'dev'] },
  { prefix: '/secretaria', roles: ['secretaria', 'admin', 'dev'] },
  { prefix: '/vendedor', roles: ['vendedor', 'admin', 'dev'] },
  { prefix: '/dev', roles: ['dev'] },
  { prefix: '/cliente', roles: ['cliente', 'vendedor', 'secretaria', 'finanzas', 'contenido', 'admin', 'dev'] },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const matched = PROTECTED.find((p) => pathname.startsWith(p.prefix));
  if (!matched) return NextResponse.next();

  // Check for session cookie (set by Firebase Auth via custom token or client side)
  // Note: Full role validation is done client-side via useAuth() + RoleGuard component.
  // Middleware checks for presence of a session cookie as a basic gate.
  const session = request.cookies.get('ran_session');
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/finanzas/:path*',
    '/contenido/:path*',
    '/secretaria/:path*',
    '/vendedor/:path*',
    '/dev/:path*',
    '/cliente/:path*',
  ],
};
