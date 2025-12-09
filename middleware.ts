import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );

  // Detect tablet devices (we want to allow tablets)
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);

  // If it's mobile (but not tablet) and not already on the mobile-blocked page
  if (isMobile && !isTablet && !request.nextUrl.pathname.startsWith('/mobile-blocked')) {
    // Redirect to mobile-blocked page
    return NextResponse.redirect(new URL('/mobile-blocked', request.url));
  }

  // If on mobile-blocked page but not on mobile, redirect to home
  if (request.nextUrl.pathname.startsWith('/mobile-blocked') && (!isMobile || isTablet)) {
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
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
