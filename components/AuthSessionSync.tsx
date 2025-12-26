"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function AuthSessionSync() {
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function checkSession() {
      try {
        const supabase = getSupabase();

        // Check session from Supabase (reads from localStorage automatically)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthSessionSync] Session error:', error.message);
        }

        if (!session) {
          console.log('[AuthSessionSync] No session found, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
          return;
        }

        console.log('[AuthSessionSync] Session valid for:', session.user?.email);
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
      }
    }

    // Small delay to ensure Supabase client has initialized
    setTimeout(checkSession, 100);
  }, [router, pathname]);

  return null;
}
