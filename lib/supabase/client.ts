import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase browser client is not available on the server');
  }
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase env (URL/ANON_KEY) tidak ditemukan');
    }

    // Minimal cookie handlers to read server-set cookies
    _client = createBrowserClient(url, key, {
      cookies: {
        get(name: string) {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [cookieName, ...cookieValue] = cookie.split('=');
            if (cookieName.trim() === name) {
              return cookieValue.join('=').trim();
            }
          }
          return null;
        },
        set(name: string, value: string, options: any) {
          let cookie = `${name}=${value}`;
          if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
          if (options?.path) cookie += `; Path=${options.path}`;
          if (options?.domain) cookie += `; Domain=${options.domain}`;
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
          if (options?.secure) cookie += `; Secure`;
          document.cookie = cookie;
        },
        remove(name: string, options: any) {
          let cookie = `${name}=; Max-Age=0`;
          if (options?.path) cookie += `; Path=${options.path}`;
          if (options?.domain) cookie += `; Domain=${options.domain}`;
          document.cookie = cookie;
        },
      },
    });
  }
  return _client;
}

// Backwards-compatible default export for existing imports
export const supabase = typeof window !== 'undefined' ? getSupabase() : ({} as any);
