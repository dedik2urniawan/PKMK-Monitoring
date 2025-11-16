'use client'

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

export async function getClientTokens(): Promise<{ access: string | null; refresh: string | null }> {
  let access: string | null = null
  let refresh: string | null = null
  if (typeof window === 'undefined') return { access, refresh }
  try {
    const { getSupabase } = await import('@/lib/supabase/client')
    const supabase = getSupabase()
    const { data } = await supabase.auth.getSession()
    access = data.session?.access_token ?? null
    refresh = data.session?.refresh_token ?? null
  } catch {}
  try {
    if (!access) access = window.localStorage.getItem('sb:access_token')
    if (!refresh) refresh = window.localStorage.getItem('sb:refresh_token')
  } catch {}
  return { access, refresh }
}

export async function syncServerSession(access?: string | null, refresh?: string | null) {
  if (typeof window === 'undefined') return false
  let acc = access
  let ref = refresh
  if (!acc || !ref) {
    const stored = await getClientTokens()
    if (!acc) acc = stored.access
    if (!ref) ref = stored.refresh
  }
  if (!acc || !ref) return false
  try {
    const key = `sb:synced:${acc.slice(0, 16)}`
    if (sessionStorage.getItem(key)) return true
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ access_token: acc, refresh_token: ref }),
    })
    if (!res.ok) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}
