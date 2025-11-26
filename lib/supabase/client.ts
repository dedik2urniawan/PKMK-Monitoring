import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    // During SSR/build, avoid instantiating the browser client
    throw new Error('Supabase browser client is not available on the server');
  }
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase env (URL/ANON_KEY) tidak ditemukan');
    }
    _client = createBrowserClient(url, key, {
      cookies: {
        get(name) {
          if (typeof document === 'undefined') return null;
          const m = document.cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${name}=`));
          return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : null;
        },
        set(name, value, options) {
          if (typeof document === 'undefined') return;
          const parts = [`${name}=${encodeURIComponent(value)}`];
          if (options?.path) parts.push(`Path=${options.path}`);
          if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
          if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`);
          if (options?.domain) parts.push(`Domain=${options.domain}`);
          if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
          if (options?.secure) parts.push('Secure');
          document.cookie = parts.join('; ');
        },
        remove(name, options) {
          if (typeof document === 'undefined') return;
          const parts = [`${name}=`, 'Max-Age=0'];
          if (options?.path) parts.push(`Path=${options.path}`);
          if (options?.domain) parts.push(`Domain=${options.domain}`);
          document.cookie = parts.join('; ');
        },
      },
    });
  }
  return _client;
}

// Backwards-compatible default export for existing imports
export const supabase = typeof window !== 'undefined' ? getSupabase() : ({} as any);
