import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const appUser = await getAppUser();
  if (!appUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const { kohort_id, tgl_selesai, catatan } = body;

  if (!kohort_id) {
    return new Response("kohort_id wajib diisi", { status: 400 });
  }

  const completionDate = tgl_selesai || new Date().toISOString().split("T")[0];

  // Fetch cohort and check permissions
  const { data: kohort, error: fetchErr } = await supabase
    .from("kohort")
    .select("id, puskesmas_id, balita_id, status")
    .eq("id", kohort_id)
    .maybeSingle();

  if (fetchErr || !kohort) {
    return new Response("Kohort tidak ditemukan", { status: 404 });
  }

  if (appUser.role === "admin_puskesmas" && appUser.puskesmas_id) {
    if (kohort.puskesmas_id !== appUser.puskesmas_id) {
      return new Response("Akses ditolak (Puskesmas berbeda)", { status: 403 });
    }
  }

  // Update status to 'selesai' and set periode_selesai
  const { error: updateErr } = await supabase
    .from("kohort")
    .update({
      status: "selesai",
      periode_selesai: completionDate,
      catatan: catatan || null,
    })
    .eq("id", kohort_id);

  if (updateErr) {
    console.error("[POST /api/kohort/selesai] Update error:", updateErr);
    return new Response(updateErr.message, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Intervensi kohort berhasil ditandai Selesai",
    kohort_id,
    periode_selesai: completionDate,
  });
}
