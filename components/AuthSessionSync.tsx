"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function AuthSessionSync() {
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function checkSession() {
      try {
        const supabase = getSupabase();

        // Give Supabase time to initialize and restore session from localStorage
        await new Promise(resolve => setTimeout(resolve, 200));

        // Now check the session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthSessionSync] Session error:', error.message);
        }

        if (!session) {
          console.log('[AuthSessionSync] No session found after init, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
          return;
        }

        console.log('[AuthSessionSync] Session valid for:', session.user?.email);
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, [router, pathname]);

  // Show nothing while checking (no flash)
  if (isChecking) {
    return null;
  }

  return null;
}
