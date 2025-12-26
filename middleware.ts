import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Response yang bisa dimodifikasi cookie-nya
  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  // Client Supabase (server) dengan cookie helper
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
            res.cookies.set({
              name,
              value,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
            });
          });
        },
      },
    }
  );

  // PENTING: Refresh session untuk memperbarui token yang expired
  // Ini akan otomatis set cookie baru jika token di-refresh
  const { data: { user }, error } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Skip untuk static files dan API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files like .ico, .png, etc.
  ) {
    return res;
  }

  // Semua routes di bawah /(private) harus terproteksi
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/balita") ||
    pathname.startsWith("/kohort") ||
    pathname.startsWith("/monitoring") ||
    pathname.startsWith("/logistik") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/riwayat") ||
    pathname.startsWith("/rekap-laporan");

  // Jika route protected dan tidak ada user, redirect ke login
  if (isProtected && !user) {
    console.log('[Middleware] No user found, redirecting to login from:', pathname);
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    // Match all protected routes
    "/dashboard/:path*",
    "/balita/:path*",
    "/kohort/:path*",
    "/monitoring/:path*",
    "/logistik/:path*",
    "/import/:path*",
    "/riwayat/:path*",
    "/rekap-laporan/:path*",
  ],
};
