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

  // CRITICAL: Baca dari Authorization header PERTAMA (untuk Vercel compatibility)
  try {
    const hdrs = await headers()
    const authHeader = hdrs.get('authorization')
    const refresh = hdrs.get('x-refresh-token')

    // Jika ada header Authorization, gunakan itu (prioritas utama)
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim()
      if (token && refresh) {
        // Set session dari header tokens
        const { error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refresh
        })
        if (error) {
          console.error('getAppUser setSession error:', error.message)
        }
      }
    }
  } catch (e) {
    console.error('getAppUser header parsing error:', e)
  }

  // Dapatkan user (dari session yang baru di-set atau dari cookie)
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr) {
    console.error('getAppUser auth.getUser error:', authErr.message)
    return null
  }

  const user = auth.user
  if (!user) return null

  // Lookup user di app_users table
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
