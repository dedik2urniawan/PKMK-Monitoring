"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { syncServerSession } from "@/lib/clientSession";

export default function AuthSessionSync() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function checkSession() {
      try {
        const supabase = getSupabase();

        // Wait for Supabase to initialize and load session from localStorage
        // This is important because getSession() might return null before localStorage is read
        let session = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!session && attempts < maxAttempts) {
          const { data } = await supabase.auth.getSession();
          session = data.session;

          if (!session && attempts < maxAttempts - 1) {
            // Wait a bit for localStorage to be read
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          attempts++;
        }

        if (!session) {
          // Double check: maybe we can read from localStorage directly
          const storedSession = localStorage.getItem('supabase.auth.token');
          if (storedSession) {
            console.log('[AuthSessionSync] Found stored session, trying to recover...');
            try {
              const parsed = JSON.parse(storedSession);
              if (parsed?.access_token && parsed?.refresh_token) {
                // Try to set session manually
                const { error } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                });
                if (!error) {
                  session = parsed;
                }
              }
            } catch (e) {
              console.warn('[AuthSessionSync] Could not recover session:', e);
            }
          }
        }

        if (!session) {
          console.log('[AuthSessionSync] No session found after retries, redirecting to login');
          router.replace('/login?redirectedFrom=' + encodeURIComponent(pathname));
          return;
        }

        // Sync session to server for API calls
        await syncServerSession();
        console.log('[AuthSessionSync] Session verified successfully');
      } catch (err) {
        console.error('[AuthSessionSync] Error:', err);
        // Don't redirect on error - might be network issue
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, [router, pathname]);

  // Don't render anything, just check session
  return null;
}
