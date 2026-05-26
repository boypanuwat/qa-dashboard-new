import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login');
    const isRootPage = req.nextUrl.pathname === '/';

    // If on root page and authenticated, redirect to dashboard
    if (isRootPage && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If on root page and not authenticated, redirect to login
    if (isRootPage && !isAuth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // If on auth page (login) and authenticated, redirect to dashboard
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without authentication
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true;
        }
        // All other pages require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protect all routes except public ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    String.raw`/((?!api|_next/static|_next/image|favicon.ico|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.svg$).*)`,
  ],
};
