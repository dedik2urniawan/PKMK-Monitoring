import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Deteksi cookie Supabase secara fleksibel
  const cookies = req.cookies.getAll();
  const hasAuthCookie = cookies.some((c) =>
    c.name.startsWith("sb-") && (c.name.includes("access-token") || c.name.includes("auth-token") || c.name.includes("refresh-token"))
  );

  const { pathname } = req.nextUrl;

  // Proteksi halaman privat
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/balita") || pathname.startsWith("/kohort") || pathname.startsWith("/monitoring");
  if (isProtected && !hasAuthCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/balita/:path*",
    "/kohort/:path*",
    "/monitoring/:path*",
  ],
};
