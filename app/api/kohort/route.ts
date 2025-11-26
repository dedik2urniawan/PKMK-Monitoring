import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check menggunakan getAppUser (support JWT decode)
  const appUser = await getAppUser();
  if (!appUser) {
    console.error('[POST /api/kohort] No appUser, unauthorized');
    return new Response("Unauthorized", { status: 401 });
  }

  console.log('[POST /api/kohort] User:', {
    id: appUser.id,
    role: appUser.role,
    puskesmas_id: appUser.puskesmas_id
  });

  const body = await req.json().catch(() => ({} as any));
  const { balita_id, periode_mulai, puskesmas_id: bodyPkm } = body;
  if (!balita_id || !periode_mulai) return new Response("Data kurang", { status: 400 });

  // Determine puskesmas_id
  let puskesmas_id: string | null = appUser.puskesmas_id;

  // Admin puskesmas harus pakai puskesmas_id dari profile
  if (appUser.role === 'admin_puskesmas') {
    if (!puskesmas_id) {
      return new Response("puskesmas_id tidak ditemukan di profile user", { status: 400 });
    }
  } else if (appUser.role === 'superadmin') {
    // Superadmin bisa specify via body atau ambil dari balita
    if (bodyPkm) {
      puskesmas_id = bodyPkm as string;
    }
  }

  // Fallback ambil dari balita jika masih null
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

  const { error: insertError } = await supabase.from("kohort").insert({
    balita_id,
    puskesmas_id,
    periode_mulai,
  });
  if (insertError) return new Response(insertError.message, { status: 400 });

  return NextResponse.json({ ok: true });
}
