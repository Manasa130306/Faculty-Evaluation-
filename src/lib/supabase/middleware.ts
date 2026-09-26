import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // Only initialize when valid URL is available
  if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project')) {
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Protect /admin routes
    if (pathname.startsWith('/admin') && pathname !== '/admin-login' && pathname !== '/admin/login') {
      // If server session exists and user is explicitly a non-admin role, redirect to faculty
      const role = user?.user_metadata?.role;
      if (user && role && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/faculty';
        return NextResponse.redirect(url);
      }
    }

    // 2. Protect /faculty routes
    if (pathname.startsWith('/faculty')) {
      const role = user?.user_metadata?.role;
      if (user && role && role === 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
    }

    // 3. Auth pages redirect if already authenticated with verified server session
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/admin-login' || pathname === '/admin/login')) {
      const role = user.user_metadata?.role;
      const url = request.nextUrl.clone();
      url.pathname = role === 'admin' ? '/admin/dashboard' : '/faculty';
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error('Supabase middleware session error:', err);
  }

  return supabaseResponse;
}

