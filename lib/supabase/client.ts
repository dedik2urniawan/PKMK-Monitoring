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

    // Use localStorage for session storage to avoid httpOnly cookie issues in production
    _client = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        storageKey: 'supabase.auth.token',
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null;
            return window.localStorage.getItem(key);
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return;
            window.localStorage.setItem(key, value);
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem(key);
          },
        },
      },
    });
  }
  return _client;
}

// Backwards-compatible default export for existing imports
export const supabase = typeof window !== 'undefined' ? getSupabase() : ({} as any);

