import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AppUser = {
  id: string
  email: string
  role: 'superadmin' | 'admin_puskesmas'
  puskesmas_id: string | null
}

export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  try {
    const hdrs = headers()
    const auth = hdrs.get('authorization')
    const refresh = hdrs.get('x-refresh-token')
    if (auth && refresh && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7).trim()
      if (token && refresh) {
        await supabase.auth.setSession({ access_token: token, refresh_token: refresh })
      }
    }
  } catch {}
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null
  // Prefer lookup by id; fallback to email to be resilient
  let q = supabase.from('app_users').select('id,email,role,puskesmas_id').eq('id', user.id).maybeSingle()
  let { data, error } = await q
  if (error && error.code !== 'PGRST116') throw error
  if (!data) {
    const r2 = await supabase.from('app_users').select('id,email,role,puskesmas_id').eq('email', user.email!).maybeSingle()
    if (r2.error && r2.error.code !== 'PGRST116') throw r2.error
    data = r2.data as any
  }
  if (!data) return null
  return data as AppUser
}
