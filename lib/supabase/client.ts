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
    _client = createBrowserClient(url, key);
  }
  return _client;
}

// Backwards-compatible default export for existing imports
export const supabase = typeof window !== 'undefined' ? getSupabase() : ({} as any);
