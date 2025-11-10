import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const meta = (user.user_metadata || {}) as any;
  let puskesmas_id: string | null = meta.puskesmas_id ?? null;

  const { balita_id, periode_mulai, puskesmas_id: bodyPkm } = await req.json();
  if (!balita_id || !periode_mulai) return new Response("Data kurang", { status: 400 });

  // Fallback body
  if (!puskesmas_id && bodyPkm) puskesmas_id = bodyPkm as string;

  // Fallback ambil dari balita
  if (!puskesmas_id) {
    const { data: b, error: be } = await supabase
      .from("balita")
      .select("puskesmas_id")
      .eq("id", balita_id)
      .maybeSingle();
    if (be) return new Response(be.message, { status: 400 });
    puskesmas_id = (b as any)?.puskesmas_id ?? null;
  }

  if (!puskesmas_id) {
    return new Response(
      "puskesmas_id tidak ditemukan (set di user_metadata, kirim via body, atau pastikan ada di data balita)",
      { status: 400 }
    );
  }

  const { error } = await supabase.from("kohort").insert({
    balita_id,
    puskesmas_id,
    periode_mulai,
  });
  if (error) return new Response(error.message, { status: 400 });

  return NextResponse.json({ ok: true });
}
