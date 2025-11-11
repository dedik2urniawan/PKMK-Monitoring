"use client";
import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";

export default function AuthSessionSync() {
  const onceRef = useRef(false);
  useEffect(() => {
    if (onceRef.current) return; // avoid double in strict mode
    onceRef.current = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const s = data.session;
        if (s?.access_token && s.refresh_token) {
          // Avoid spamming: only resync when token changes
          const key = `sb:synced:${s.access_token.slice(0,16)}`;
          if (!sessionStorage.getItem(key)) {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token }),
            });
            sessionStorage.setItem(key, "1");
          }
        }
      } catch {}
    })();
  }, []);
  return null;
}

