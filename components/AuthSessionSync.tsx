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
      // Wait longer for Supabase to fully initialize and restore session from localStorage
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const supabase = getSupabase();
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

    checkSession();
  }, [router, pathname]);

  return null;
}
