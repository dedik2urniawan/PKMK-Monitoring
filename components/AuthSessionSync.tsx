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
        // FIRST: Check if there's ANY session data in localStorage
        // Supabase stores session in key like: sb-{projectId}-auth-token
        const hasStoredSession = Object.keys(localStorage).some(key =>
          key.includes('sb-') && key.includes('-auth-token')
        );

        if (!hasStoredSession) {
          // No session in localStorage at all - redirect immediately
          console.log('[AuthSessionSync] No stored session found, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
          return;
        }

        // SECOND: Session exists in localStorage, give Supabase time to restore it
        console.log('[AuthSessionSync] Found stored session, waiting for Supabase to restore...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // THIRD: Now check if Supabase successfully restored the session
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // localStorage has data but Supabase can't restore - possibly expired
          console.log('[AuthSessionSync] Session expired or invalid, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
          return;
        }

        console.log('[AuthSessionSync] Session valid for:', session.user?.email);
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
        router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
      }
    }

    checkSession();
  }, [router, pathname]);

  return null;
}
