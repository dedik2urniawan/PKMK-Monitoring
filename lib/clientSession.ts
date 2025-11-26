'use client'

import { getSupabase } from "@/lib/supabase/client";

// Dengan cookie-based auth Supabase (@supabase/ssr), token ada di cookie,
// tapi kita juga kirimkan via header sebagai fallback agar route handler bisa setSession.

export function persistClientTokens() {}
export function clearClientTokens() {}

export async function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    const refresh = data.session?.refresh_token ?? null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (refresh) headers["x-refresh-token"] = refresh;
    return headers;
  } catch {
    return {};
  }
}

export async function syncServerSession() {
  if (typeof window === "undefined") return false;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const refresh = data.session?.refresh_token;
    if (!token || !refresh) return false;
    const key = `sb:synced:${token.slice(0, 12)}`;
    if (sessionStorage.getItem(key)) return true;
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token: token, refresh_token: refresh }),
    });
    if (!res.ok) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

export async function ensureServerSession() {
  return syncServerSession();
}
