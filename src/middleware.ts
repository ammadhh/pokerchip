import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get authentication token from cookies
  const token = request.cookies.get('supabase-auth-token');
  
  // Define protected paths
  const protectedPaths = ['/profile', '/table'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to home if accessing protected path without auth
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};