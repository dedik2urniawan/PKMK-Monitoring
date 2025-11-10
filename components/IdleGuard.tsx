"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

// Client-side idle guard with warning dialog before auto sign-out.
// Default idle = 5 minutes, warning = 30 seconds before logout.
export default function IdleGuard({ ms, warnMs }: { ms?: number; warnMs?: number }) {
  const IDLE_MS = ms ?? Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS || 5 * 60 * 1000);
  const WARN_MS = warnMs ?? Number(process.env.NEXT_PUBLIC_IDLE_WARN_MS || 30 * 1000);

  const logoutTimerRef = useRef<number | null>(null);
  const warnTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const [showWarn, setShowWarn] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(WARN_MS / 1000));

  async function doLogout() {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  }

  function clearAll() {
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    logoutTimerRef.current = null;
    warnTimerRef.current = null;
    countdownRef.current = null;
  }

  function startTimers() {
    clearAll();
    setShowWarn(false);
    setSecondsLeft(Math.round(WARN_MS / 1000));
    // Warning timer
    warnTimerRef.current = window.setTimeout(() => {
      setShowWarn(true);
      const start = Date.now();
      setSecondsLeft(Math.round(WARN_MS / 1000));
      countdownRef.current = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const remain = Math.max(0, Math.ceil((WARN_MS - elapsed) / 1000));
        setSecondsLeft(remain);
      }, 250);
    }, Math.max(0, IDLE_MS - WARN_MS));

    // Logout timer
    logoutTimerRef.current = window.setTimeout(() => {
      doLogout();
    }, IDLE_MS);
  }

  function resetActivity() {
    if (document.visibilityState === "hidden") return;
    startTimers();
  }

  useEffect(() => {
    startTimers();
    const events: Array<keyof DocumentEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "visibilitychange",
    ];
    events.forEach((ev) => document.addEventListener(ev, resetActivity, { passive: true } as any));
    return () => {
      clearAll();
      events.forEach((ev) => document.removeEventListener(ev, resetActivity as any));
    };
  }, [IDLE_MS, WARN_MS]);

  return !showWarn ? null : (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white shadow-xl p-5">
          <div className="text-lg font-semibold mb-1">Sesi hampir berakhir</div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Tidak ada aktivitas terdeteksi. Otomatis logout dalam <span className="font-medium">{secondsLeft}s</span>.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              className="px-3 py-1.5 rounded border border-[var(--border)] bg-white hover:bg-gray-50"
              onClick={doLogout}
            >
              Keluar sekarang
            </button>
            <button
              className="px-3 py-1.5 rounded bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white"
              onClick={() => startTimers()}
            >
              Tetap masuk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
