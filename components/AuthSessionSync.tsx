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
        // Check for session tokens we manually save during login
        const hasAccessToken = localStorage.getItem('sb_access_token');
        const hasRefreshToken = localStorage.getItem('sb_refresh_token');

        if (!hasAccessToken || !hasRefreshToken) {
          console.log('[AuthSessionSync] No stored tokens, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
          return;
        }

        console.log('[AuthSessionSync] Session tokens found, user authenticated');
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
        router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
      }
    }

    checkSession();
  }, [router, pathname]);

  return null;
}
