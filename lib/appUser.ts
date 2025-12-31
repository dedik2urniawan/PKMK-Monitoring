import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AppUser = {
  id: string
  email: string
  role: 'superadmin' | 'admin_puskesmas'
  puskesmas_id: string | null
}

// Helper untuk decode JWT (base64url decode)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload (part 1)
    const payload = parts[1];
    // Base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('[decodeJWT] Error:', e);
    return null;
  }
}

export async function getAppUser(): Promise<AppUser | null> {
  console.log('[getAppUser] START');
  const supabase = await createClient()

  let userId: string | null = null;
  let userEmail: string | null = null;

  // CRITICAL: Baca dari Authorization header dan decode JWT
  try {
    const hdrs = await headers()
    const authHeader = hdrs.get('authorization')

    console.log('[getAppUser] Headers:', {
      hasAuth: !!authHeader
    });

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const jwt = authHeader.slice(7).trim()
      if (jwt) {
        console.log('[getAppUser] Decoding JWT token...');
        const decoded = decodeJWT(jwt);

        if (decoded) {
          console.log('[getAppUser] JWT decoded:', {
            sub: decoded.sub,
            email: decoded.email,
            exp: decoded.exp,
            now: Math.floor(Date.now() / 1000)
          });

          // Check expiration
          if (decoded.exp && decoded.exp > Math.floor(Date.now() / 1000)) {
            userId = decoded.sub; // 'sub' is user ID in JWT
            userEmail = decoded.email;
            console.log('[getAppUser] JWT valid, user:', { userId, userEmail });
          } else {
            console.error('[getAppUser] JWT expired!');
          }
        } else {
          console.error('[getAppUser] JWT decode failed');
        }
      }
    }
  } catch (e) {
    console.error('[getAppUser] Header parsing error:', e)
  }

  // Fallback: coba baca dari cookie jika header tidak ada
  if (!userId) {
    console.log('[getAppUser] No user from JWT, trying cookies...');
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (!authErr && auth.user) {
      userId = auth.user.id;
      userEmail = auth.user.email || null;
      console.log('[getAppUser] Got user from cookie:', { userId, userEmail });
    } else {
      // Expected on SSR when using localStorage-based auth - not a real error
      console.log('[getAppUser] No session from cookie (expected with localStorage auth)');
    }
  }

  if (!userId) {
    console.log('[getAppUser] No user ID found, returning null');
    return null;
  }

  // Lookup user di app_users table menggunakan user ID dari JWT/cookie
  console.log('[getAppUser] Looking up in app_users by id:', userId);
  let q = supabase.from('app_users').select('id,email,role,puskesmas_id').eq('id', userId).maybeSingle()
  let { data, error } = await q

  if (error && error.code !== 'PGRST116') {
    console.error('[getAppUser] app_users query error:', error);
    throw error;
  }

  if (!data && userEmail) {
    console.log('[getAppUser] No data by ID, trying email:', userEmail);
    const r2 = await supabase.from('app_users').select('id,email,role,puskesmas_id').eq('email', userEmail).maybeSingle()
    if (r2.error && r2.error.code !== 'PGRST116') {
      console.error('[getAppUser] app_users email query error:', r2.error);
      throw r2.error;
    }
    data = r2.data as any
  }

  if (!data) {
    console.error('[getAppUser] User not found in app_users table!', { userId, userEmail });
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
