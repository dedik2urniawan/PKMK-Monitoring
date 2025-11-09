"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
    const target = searchParams.get("redirectedFrom") || "/dashboard";
    router.replace(target);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
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

      {/* Right login panel */}
      <div className="flex items-center justify-center bg-[var(--background)] p-6 md:p-10">
        <div className="w-[420px] md:w-[460px]">
          <Card className="shadow-lg">
            <CardHeader className="flex items-center gap-3">
              <Image src="/tindik-anting-logo.png" alt="PKMK" width={40} height={40} />
              <CardTitle className="text-2xl">Login</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 px-6 pb-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="mt-1 h-12 rounded-lg text-base"
                    placeholder="nama@dinkes.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="mt-1 h-12 rounded-lg text-base"
                    placeholder="********"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {err && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{err}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white"
                >
                  {loading ? "Memproses..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
            (c) Dinkes Kab. Malang - Sistem Pelaporan PKMK
          </p>
        </div>
      </div>
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

