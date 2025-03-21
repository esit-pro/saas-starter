import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

// Public routes that should not be redirected to sign-in
const publicRoutes = ['/sign-in', '/api'];
// Registration is temporarily disabled for private testing
// const publicRoutes = ['/sign-in', '/sign-up', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  
  // Temporarily redirect sign-up requests to sign-in with a message
  if (pathname.startsWith('/sign-up')) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('message', 'Registration is temporarily disabled for private testing');
    return NextResponse.redirect(signInUrl);
  }
  
  // Check if this is a public route that doesn't need authentication
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If it's not a public route and there's no session cookie, redirect to sign-in
  if (!isPublicRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  // If there's a session cookie, verify and refresh it
  if (sessionCookie && request.method === "GET") {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (!isPublicRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};