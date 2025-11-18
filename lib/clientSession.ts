'use client'

import { getSupabase } from "@/lib/supabase/client";

export function persistClientTokens(access?: string | null, refresh?: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (access) window.localStorage.setItem('sb:access_token', access)
    if (refresh) window.localStorage.setItem('sb:refresh_token', refresh)
  } catch {}
}

export function clearClientTokens() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('sb:access_token')
    window.localStorage.removeItem('sb:refresh_token')
  } catch {}
}

export async function syncServerSession(accessToken?: string | null, refreshToken?: string | null) {
  if (typeof window === 'undefined') return false
  try {
    const { getSupabase } = await import('@/lib/supabase/client')
    const supabase = getSupabase()
    let session = (await supabase.auth.getSession()).data.session
    if (accessToken && refreshToken && (!session?.access_token || !session.refresh_token)) {
      session = { access_token: accessToken, refresh_token: refreshToken } as any
    }
    if (!session?.access_token || !session.refresh_token) return false
    const key = `sb:synced:${session.access_token.slice(0, 16)}`
    if (sessionStorage.getItem(key)) return true
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }),
    })
    if (!res.ok) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}

export async function ensureServerSession() {
  return syncServerSession()
}

export async function getAuthHeaders() {
  if (typeof window === 'undefined') return {}
  try {
    const supabase = getSupabase()
    const { data } = await supabase.auth.getSession()
    let token = data.session?.access_token ?? null
    let refresh = data.session?.refresh_token ?? null
    try {
      if (!token) token = window.localStorage.getItem('sb:access_token')
      if (!refresh) refresh = window.localStorage.getItem('sb:refresh_token')
    } catch {}
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (refresh) headers['x-refresh-token'] = refresh
    return headers
  } catch {
    return {}
  }
}
