"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Clock, AlertTriangle } from "lucide-react";

// Client-side idle guard with warning dialog before auto sign-out.
// Default idle = 1 hour (60 minutes), warning = 1 minute before logout.
export default function IdleGuard({ ms, warnMs }: { ms?: number; warnMs?: number }) {
  const IDLE_MS = ms ?? Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS || 60 * 60 * 1000); // 1 hour
  const WARN_MS = warnMs ?? Number(process.env.NEXT_PUBLIC_IDLE_WARN_MS || 60 * 1000); // 1 minute warning

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Peringatan Sesi</h3>
            <p className="text-xs text-white/90">Tidak ada aktivitas terdeteksi</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Countdown Circle */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 mb-3">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - secondsLeft / (WARN_MS / 1000))}`}
                  className="text-amber-500 transition-all"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{secondsLeft}</div>
                  <div className="text-xs text-gray-500">detik</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Sesi akan berakhir otomatis</span>
            </div>
          </div>

          <p className="text-sm text-[var(--muted-foreground)] text-center mb-4">
            Anda akan secara otomatis keluar dari sistem jika tidak ada aktivitas.
            Klik <span className="font-semibold">Tetap Masuk</span> untuk melanjutkan sesi.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={doLogout}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white hover:bg-gray-50 text-[var(--foreground)] font-medium transition-colors"
          >
            Keluar Sekarang
          </button>
          <button
            onClick={() => startTimers()}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-600)] hover:from-[var(--primary-600)] hover:to-[var(--primary-700)] text-white font-medium transition-all shadow-sm"
          >
            Tetap Masuk
          </button>
        </div>
      </div>
    </div>
  );
}
