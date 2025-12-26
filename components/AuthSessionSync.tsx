"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { syncServerSession } from "@/lib/clientSession";

export default function AuthSessionSync() {
  const router = useRouter();
  const onceRef = useRef(false);

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    async function checkAndSync() {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('[AuthSessionSync] No session found, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(window.location.pathname));
          return;
        }

        // Sync session to server for API calls
        await syncServerSession();
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
        router.replace('/login');
      }
    }

    checkAndSync();
  }, [router]);

  return null;
}

