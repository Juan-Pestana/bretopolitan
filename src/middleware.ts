import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard'];

  // Get the current pathname
  const { pathname } = req.nextUrl;

  // Debug logging
  console.log('Middleware running for:', pathname);
  console.log('Session exists:', !!session);
  console.log('Session user:', session?.user?.email || 'No user');

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If user is not authenticated and trying to access a protected route
  if (!session && isProtectedRoute) {
    console.log('Redirecting to login - no session for protected route');
    // Create a redirect URL that preserves the original destination
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);

    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access login/signup pages
  // But only redirect if they don't have a redirectTo parameter (to avoid conflicts with client-side redirects)
  if (session && (pathname === '/login' || pathname === '/sign-up')) {
    const hasRedirectTo = req.nextUrl.searchParams.has('redirectTo');
    if (!hasRedirectTo) {
      console.log('Redirecting authenticated user away from auth pages');
      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      console.log(
        'Authenticated user on auth page with redirectTo - allowing client-side redirect'
      );
    }
  }

  // If user is authenticated and on the home page, redirect to dashboard
  if (session && pathname === '/') {
    console.log('Redirecting authenticated user from home to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
