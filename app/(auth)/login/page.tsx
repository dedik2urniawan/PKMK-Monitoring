"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Math CAPTCHA state - initialized to 0, set in useEffect to avoid hydration mismatch
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
    try {
      const session = data.session || (await supabase.auth.getSession()).data.session;
      if (session?.access_token && session.refresh_token) {
        // Simpan ke localStorage PERTAMA (paling penting untuk Vercel)
        localStorage.setItem('sb_access_token', session.access_token);
        localStorage.setItem('sb_refresh_token', session.refresh_token);

        // Await the sync to ensure cookies are set before redirecting
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
        }).catch(e => console.error("Sync error:", e));
      }
    } catch (e) {
      console.error("Session handling error:", e);
    }
    const target = searchParams.get("redirectedFrom") || "/dashboard";
    if (typeof window !== "undefined") window.location.assign(target);
    else router.replace(target);
  }

  return (
    <div
      className="min-h-screen grid grid-cols-1 md:grid-cols-2"
      style={{
        background: 'linear-gradient(to bottom right, #ecfdf5, #f0fdfa, #ecfeff)'
      }}
    >
      {/* Left info panel */}
      <div
        className="relative hidden md:flex items-center justify-center overflow-hidden p-12 text-white"
        style={{
          background:
            "radial-gradient(1200px 600px at -10% -10%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(800px 400px at 120% 20%, rgba(255,255,255,0.08), transparent 60%), linear-gradient(135deg, var(--primary-700), var(--primary-600), #1fc3b3)",
        }}
      >
        <div className="max-w-xl">
          <div className="mb-6">
            <Image src="/tindik-anting-logo.png" alt="PKMK" width={220} height={80} priority />
          </div>
          <h2 className="text-4xl font-semibold leading-tight">Aplikasi Intervensi Stunting dan Monev PKMK</h2>
          <p className="mt-4 text-white/90 text-sm">
            Aplikasi Intervensi Stunting dan Monitoring Evaluasi menggunakan formula ONS (Oral Nutrition Supplement)
            atau PKMK (Pangan Olahan untuk Keperluan Medis Khusus) dengan pendampingan dan asistensi medis oleh
            Dokter Pediatrik Dinas Kesehatan Kabupaten Malang.
          </p>
        </div>
      </div>

      {/* Right login panel - ENHANCED */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[580px] px-4">
          <Card className="shadow-2xl border border-gray-200/60 border-t-4 border-t-[var(--primary)] overflow-hidden backdrop-blur-sm bg-white/95 animate-fade-in-up">
            <CardHeader className="flex items-center gap-4 pb-6 pt-10 px-10">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0">
                  <Image src="/tindik-anting-logo.png" alt="PKMK" width={50} height={50} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold text-gray-900">Selamat Datang</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Masuk ke sistem monitoring PKMK</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 px-10 pb-10">
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-base font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="mt-2 h-14 rounded-xl text-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="nama@dinkes.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-base font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="mt-2 h-14 rounded-xl text-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  {/* Show Password Toggle */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="showPassword"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor="showPassword"
                      className="text-sm text-gray-600 cursor-pointer select-none"
                    >
                      Tampilkan Password
                    </label>
                  </div>
                </div>


                {/* Math CAPTCHA */}
                <div className="space-y-3">
                  <Label htmlFor="captcha" className="text-base font-medium text-gray-700">Verifikasi (CAPTCHA)</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-gray-100 border-2 border-gray-300 rounded-lg px-6 py-3 text-center min-w-[140px]">
                      <p className="text-2xl font-bold text-gray-800">
                        {captchaNum1} - {captchaNum2}
                      </p>
                    </div>
                    <span className="text-xl font-medium text-gray-600">=</span>
                    <Input
                      id="captcha"
                      type="number"
                      className="h-14 rounded-xl text-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="?"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Masukkan hasil perhitungan di atas untuk melanjutkan</p>
                </div>

                {err && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{err}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : "Masuk"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer with Developer Credit */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              © Dinkes Kab. Malang - Sistem Pelaporan PKMK
            </p>
            <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
              Crafted with
              <span className="text-red-500 animate-pulse inline-block">♥</span>
              by{' '}
              <a
                href="https://dedik2urniawan.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                DK
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginForm />
    </Suspense>
  );
}

