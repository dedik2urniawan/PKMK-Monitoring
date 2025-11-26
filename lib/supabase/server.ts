// lib/supabase/server.ts
import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  function safeGet(name: string): string | undefined {
    try {
      const v = cookieStore.get(name)?.value;
      if (typeof v !== 'undefined') return v;
    } catch { }
    try {
      const raw = headerStore.get('cookie') ?? '';
      const part = raw
        .split(';')
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${name}=`));
      if (!part) return undefined;
      return decodeURIComponent(part.split('=').slice(1).join('='));
    } catch {
      return undefined;
    }
  }

  function safeSet(name: string, value: string, options: CookieOptions) {
    try {
      // @ts-ignore
      cookieStore.set({
        name,
        value,
        ...options,
        path: '/', // Force path to be root
        sameSite: 'lax', // Force SameSite to Lax
        secure: process.env.NODE_ENV === 'production', // Force Secure in production
      });
    } catch (error) {
      console.error('Error setting cookie:', name, error);
    }
  }

  function safeRemove(name: string, options: CookieOptions) {
    try {
      // @ts-ignore
      cookieStore.set({
        name,
        value: '',
        ...options,
        path: '/', // Force path to be root
        maxAge: 0,
      });
    } catch (error) {
      console.error('Error removing cookie:', name, error);
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: safeGet, set: safeSet, remove: safeRemove } }
  );
}
