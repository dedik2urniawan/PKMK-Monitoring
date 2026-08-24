"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Math CAPTCHA state
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const correctAnswer = captchaNum1 - captchaNum2;

  // Generate CAPTCHA numbers on client mount only
  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 50) + 10);
    setCaptchaNum2(Math.floor(Math.random() * 20) + 1);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Validate CAPTCHA
    if (parseInt(captchaAnswer) !== correctAnswer) {
      setErr("Jawaban CAPTCHA salah. Silakan coba lagi.");
      return;
    }

    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }

    // Supabase automatically persists the session to localStorage
    // Just verify session exists and redirect
    const session = data.session;
    if (session) {
      console.log('[Login] Login successful for:', data.user?.email);

      // Keep backup keys for API Authorization headers
      localStorage.setItem('sb_access_token', session.access_token);
      localStorage.setItem('sb_refresh_token', session.refresh_token);

      // Try to sync session cookies with server (optional, for SSR)
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "x-refresh-token": session.refresh_token,
          },
          credentials: "include",
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
      } catch (e) {
        console.warn("Session sync error (non-critical):", e);
      }
    }

    const target = searchParams.get("redirectedFrom") || "/dashboard";
    if (typeof window !== "undefined") window.location.assign(target);
    else router.replace(target);
  }

  return (
    <>
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          background: #f6f8f8;
        }
        .left-panel {
          width: 50%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
        }
        .left-panel-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .left-panel-image {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDtEaXCr0jy2PqkqWaOxEN8AW6xdo7lXoNrJVOndXioLVuwqP22ab1Xet1wZysXfwFebr7MfRUaZrT4y0oJdHckhR6naXDw2q81MvYGI5efFqrfWyjZSOK3O3ELbrIYn4CnQNa4387wt8w8M5cQSZsIhLq5v_gek1i1bwpUQxERRTH8F7dDNSSzRQ5dvYpw1E9TpWm7J9n_hqnP5-gU5olpGhl_15zGwJ4aFiKmgzsjzIRhc0cTILLpGbDJJT4NSRwNCdeRV3s6BABy');
        }
        .left-panel-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(13, 148, 136, 0.9), rgba(20, 184, 166, 0.4));
        }
        .left-panel-dark {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.2);
        }
        .left-content {
          position: relative;
          z-index: 10;
        }
        .brand-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .brand-title {
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.025em;
        }
        .hero-section {
          max-width: 32rem;
          margin-bottom: 3rem;
        }
        .hero-title {
          color: white;
          font-size: 3rem;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }
        .hero-desc {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.125rem;
          font-weight: 500;
          line-height: 1.6;
        }
        .badges {
          display: flex;
          gap: 1.5rem;
        }
        .badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 0.875rem;
        }
        .right-panel {
          width: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 6rem;
          background: white;
        }
        .form-container {
          width: 100%;
          max-width: 28rem;
        }
        .form-header {
          margin-bottom: 2rem;
        }
        .form-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin-bottom: 0.5rem;
        }
        .form-subtitle {
          color: #64748b;
          font-size: 1rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          margin-bottom: 0.5rem;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          width: 20px;
          height: 20px;
        }
        .form-input {
          width: 100%;
          height: 48px;
          padding-left: 2.5rem;
          padding-right: 2.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          font-size: 0.875rem;
          color: #0f172a;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
        }
        .form-input::placeholder {
          color: #94a3b8;
        }
        .password-toggle {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .password-toggle:hover {
          color: #64748b;
        }
        .captcha-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .captcha-display {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          min-width: 120px;
        }
        .captcha-text {
          font-size: 1.125rem;
          font-weight: 700;
          color: #334155;
          letter-spacing: 0.05em;
        }
        .captcha-equals {
          font-size: 1.125rem;
          font-weight: 500;
          color: #94a3b8;
        }
        .captcha-input {
          flex: 1;
          height: 48px;
          padding: 0 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          font-size: 0.875rem;
          color: #0f172a;
          text-align: center;
          transition: all 0.2s;
        }
        .captcha-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
        }
        .captcha-hint {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.5rem;
        }
        .error-box {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .error-text {
          font-size: 0.875rem;
          color: #b91c1c;
          font-weight: 500;
        }
        .submit-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 12px;
          background: var(--primary);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 10px 15px -3px rgba(20, 184, 166, 0.3);
          position: relative;
        }
        .submit-btn:hover {
          background: var(--primary-600);
          box-shadow: 0 15px 20px -3px rgba(20, 184, 166, 0.4);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .submit-btn svg {
          width: 20px;
          height: 20px;
        }
        .footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
          text-align: center;
        }
        .footer-help {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 1rem;
        }
        .footer-help a {
          color: #64748b;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .footer-help a:hover {
          color: var(--primary);
        }
        .footer-copyright {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 0.25rem;
        }
        .footer-credit {
          font-size: 0.75rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }
        .footer-credit a {
          color: var(--primary);
          font-weight: 700;
        }
        .footer-credit a:hover {
          text-decoration: underline;
        }
        .heart {
          color: #ef4444;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 1024px) {
          .left-panel {
            display: none;
          }
          .right-panel {
            width: 100%;
            padding: 2rem;
          }
          .form-title {
            font-size: 1.875rem;
            text-align: center;
          }
          .form-subtitle {
            text-align: center;
          }
        }
      `}</style>

      <div className="login-container">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="left-panel-bg">
            <div className="left-panel-image" />
            <div className="left-panel-overlay" />
            <div className="left-panel-dark" />
          </div>

          <div className="left-content">
            <div className="brand-header">
              <div className="brand-icon">
                <Image src="/tindik-anting-logo.png" alt="PKMK" width={32} height={32} />
              </div>
              <div className="brand-title">Dinas Kesehatan Kab. Malang</div>
            </div>
          </div>

          <div className="left-content hero-section">
            <h1 className="hero-title">PKMK Monitoring System</h1>
            <p className="hero-desc">
              Sistem terpadu untuk memantau distribusi Pangan Olahan untuk Keperluan Medis Khusus.
              Bersama kita dukung penanganan stunting di Kabupaten Malang demi masa depan generasi yang lebih sehat.
            </p>
          </div>

          <div className="left-content badges">
            <div className="badge">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure Data</span>
            </div>
            <div className="badge">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Stunting Prevention</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Masuk ke Akun Anda</h2>
              <p className="form-subtitle">Silakan masukkan kredensial Anda untuk mengakses dashboard monitoring.</p>
            </div>

            <form onSubmit={onSubmit}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="nama@dinkes.malangkab.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">Kata Sandi</label>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="form-group">
                <label className="form-label">Verifikasi (CAPTCHA)</label>
                <div className="captcha-row">
                  <div className="captcha-display">
                    <span className="captcha-text" suppressHydrationWarning>{captchaNum1} - {captchaNum2}</span>
                  </div>
                  <span className="captcha-equals">=</span>
                  <input
                    type="number"
                    className="captcha-input"
                    placeholder="?"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                  />
                </div>
                <p className="captcha-hint">Masukkan hasil perhitungan di atas untuk melanjutkan</p>
              </div>

              {/* Error */}
              {err && (
                <div className="error-box">
                  <p className="error-text">{err}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Masuk Sekarang
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="footer">
              <p className="footer-help">
                Mengalami kendala saat login?{" "}
                <a href="https://wa.me/6281216354887" target="_blank" rel="noopener noreferrer">
                  Hubungi Admin Dinkes
                </a>
              </p>
              <p className="footer-copyright">© Dinkes Kab. Malang - Sistem Pelaporan PKMK</p>
              <p className="footer-credit">
                Crafted with <span className="heart">♥</span> by{" "}
                <a href="https://dedik2urniawan.github.io/" target="_blank" rel="noopener noreferrer">DK</a>
                <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                <span style={{ opacity: 0.7, fontSize: '0.85em' }}>v2.0.0</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginForm />
    </Suspense>
  );
}
