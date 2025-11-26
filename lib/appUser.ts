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
  console.log('[getAppUser] START');
  const supabase = await createClient()

  let user: any = null;

  // CRITICAL: Baca dari Authorization header PERTAMA (untuk Vercel compatibility)
  try {
    const hdrs = await headers()
    const authHeader = hdrs.get('authorization')

    console.log('[getAppUser] Headers:', {
      hasAuth: !!authHeader
    });

    // Jika ada header Authorization, gunakan itu (prioritas utama)
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const jwt = authHeader.slice(7).trim()
      if (jwt) {
        console.log('[getAppUser] Getting user from JWT token...');
        // Gunakan getUser() dengan JWT langsung (tidak perlu setSession)
        const { data, error } = await supabase.auth.getUser(jwt)
        if (error) {
          console.error('[getAppUser] getUser(jwt) error:', error.message)
        } else if (data.user) {
          console.log('[getAppUser] User from JWT:', { id: data.user.id, email: data.user.email });
          user = data.user;
        }
      }
    }
  } catch (e) {
    console.error('[getAppUser] Header parsing error:', e)
  }

  // Fallback: coba baca dari cookie jika header tidak ada
  if (!user) {
    console.log('[getAppUser] No user from headers, trying cookies...');
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr) {
      console.error('[getAppUser] auth.getUser (cookie) error:', authErr.message)
      return null
    }
    user = auth.user;
  }

  console.log('[getAppUser] Final user:', { id: user?.id, email: user?.email });

  if (!user) {
    console.log('[getAppUser] No user found, returning null');
    return null;
  }

  // Lookup user di app_users table
  console.log('[getAppUser] Looking up in app_users by id:', user.id);
  let q = supabase.from('app_users').select('id,email,role,puskesmas_id').eq('id', user.id).maybeSingle()
  let { data, error } = await q

  if (error && error.code !== 'PGRST116') {
    console.error('[getAppUser] app_users query error:', error);
    throw error;
  }

  if (!data) {
    console.log('[getAppUser] No data by ID, trying email:', user.email);
    const r2 = await supabase.from('app_users').select('id,email,role,puskesmas_id').eq('email', user.email!).maybeSingle()
    if (r2.error && r2.error.code !== 'PGRST116') {
      console.error('[getAppUser] app_users email query error:', r2.error);
      throw r2.error;
    }
    data = r2.data as any
  }

  if (!data) {
    console.error('[getAppUser] User not found in app_users table!', { userId: user.id, userEmail: user.email });
    return null;
  }

  console.log('[getAppUser] SUCCESS:', {
    id: data.id,
    email: data.email,
    role: data.role,
    puskesmas_id: data.puskesmas_id
  });

  return data as AppUser
}
