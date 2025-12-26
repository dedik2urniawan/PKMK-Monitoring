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
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthSessionSync] Session error:', error.message);
        }

        if (session) {
          console.log('[AuthSessionSync] Session valid for:', session.user?.email);
        } else {
          // DON'T redirect - just log. Let the page handle its own auth.
          console.log('[AuthSessionSync] No session found (not redirecting)');
        }
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
      }
    }

    checkSession();
  }, []);

  return null;
}
