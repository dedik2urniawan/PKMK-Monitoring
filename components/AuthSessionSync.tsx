"use client";
import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";

export default function AuthSessionSync() {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function checkSession() {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('[AuthSessionSync] Session active for:', session.user?.email);
        } else {
          console.warn('[AuthSessionSync] No session found - user may not be authenticated');
          // Don't redirect - let the user see the page
          // They won't be able to fetch data anyway (API will return 401)
        }
      } catch (err) {
        console.error('[AuthSessionSync] Error checking session:', err);
      }
    }

    // Check session but don't block UI
    checkSession();
  }, []);

  return null;
}
