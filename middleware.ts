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
  
  // Set response for further cookie modifications
  let res = NextResponse.next();
  
  // Set registration disabled cookie for all responses
  res.cookies.set({
    name: 'registration_disabled',
    value: 'true',
    httpOnly: false, // Make it accessible to client-side JS
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days expiry
    path: '/',
  });
  
  // For sign-up, redirect to sign-in
  if (pathname.startsWith('/sign-up')) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Check if this is a public route that doesn't need authentication
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If it's not a public route and there's no session cookie, redirect to sign-in
  if (!isPublicRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

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