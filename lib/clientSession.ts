'use client'

import { getSupabase } from "@/lib/supabase/client";

// Hybrid auth: use cookies (Supabase SSR) + localStorage fallback untuk Vercel
const TOKEN_KEY = 'sb_access_token';
const REFRESH_KEY = 'sb_refresh_token';

export function persistClientTokens() { }
export function clearClientTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export async function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    let token = data.session?.access_token ?? null;
    let refresh = data.session?.refresh_token ?? null;

    // Fallback: baca dari localStorage jika cookie tidak ada
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem(TOKEN_KEY);
      refresh = localStorage.getItem(REFRESH_KEY);
    }

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

    // Simpan ke localStorage sebagai fallback
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refresh);

    // Check if we already synced this token recently to avoid spamming
    const key = `sb:synced:${token.slice(0, 12)}`;
    if (sessionStorage.getItem(key)) return true;

    console.log('Syncing session to server...');
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-refresh-token": refresh,
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ access_token: token, refresh_token: refresh }),
    });

    if (!res.ok) {
      console.error('Failed to sync session:', await res.text());
      return false;
    }

    sessionStorage.setItem(key, "1");
    return true;
  } catch (e) {
    console.error('Error syncing session:', e);
    return false;
  }
}

export async function ensureServerSession() {
  return syncServerSession();
}
