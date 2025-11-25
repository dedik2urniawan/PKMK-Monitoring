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
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Trigger refresh token jika perlu; cookie akan di-set di res
  await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/balita") ||
    pathname.startsWith("/kohort") ||
    pathname.startsWith("/monitoring");

  const isNavigation =
    req.headers.get("sec-fetch-mode") === "navigate" ||
    req.headers.get("sec-fetch-dest") === "document";

  const hasAuthCookie = req.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        (c.name.includes("access-token") ||
          c.name.includes("auth-token") ||
          c.name.includes("refresh-token"))
    );

  if (isProtected && !hasAuthCookie && isNavigation) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/balita/:path*",
    "/kohort/:path*",
    "/monitoring/:path*",
  ],
};
