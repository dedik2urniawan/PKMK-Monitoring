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
      // Clear session tokens from localStorage
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_refresh_token');
      sessionStorage.removeItem("pkmk_welcome_shown");
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: 16
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        maxWidth: 420,
        width: '100%',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle color="white" size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'white' }}>Peringatan Sesi</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>Tidak ada aktivitas terdeteksi</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 32, textAlign: 'center' }}>
          {/* Countdown Circle */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - secondsLeft / (WARN_MS / 1000))}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#ea580c' }}>{secondsLeft}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>detik</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, color: '#4b5563', fontSize: 14 }}>
            <Clock size={18} />
            <span>Sesi akan berakhir otomatis</span>
          </div>

          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Anda akan secara otomatis keluar dari sistem jika tidak ada aktivitas.
            Klik <strong>Tetap Masuk</strong> untuk melanjutkan sesi.
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12 }}>
          <button
            onClick={doLogout}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
          >
            Keluar Sekarang
          </button>
          <button
            onClick={() => startTimers()}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
            }}
          >
            Tetap Masuk
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
