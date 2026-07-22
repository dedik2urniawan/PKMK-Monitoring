import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createAdminClient as createClient } from "@/lib/supabase/server";
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

  // CONSTRAINT VALIDATION: Check for existing cohorts
  const { data: existingKohorts, error: kohortError } = await supabase
    .from("kohort")
    .select("id, periode_mulai")
    .eq("balita_id", balita_id)
    .order("periode_mulai", { ascending: false });

  if (kohortError) {
    console.error('[POST /api/kohort] Error checking existing cohorts:', kohortError);
    return new Response("Error memeriksa cohort yang ada: " + kohortError.message, { status: 500 });
  }

  // CONSTRAINT: Check if balita has completed Week 12 of latest cohort
  if (existingKohorts && existingKohorts.length > 0) {
    const latestKohort = existingKohorts[0];

    // Fetch monitoring records for the latest cohort
    const { data: monitoringRecords } = await supabase
      .from("monitoring_antropometri")
      .select("current_week")
      .eq("kohort_id", latestKohort.id)
      .order("current_week", { ascending: false })
      .limit(1);

    if (monitoringRecords && monitoringRecords.length > 0) {
      const currentWeek = monitoringRecords[0].current_week || 0;

      // If current week < 12, cohort is still active
      if (currentWeek < 12) {
        return new Response(
          `Balita masih dalam intervensi aktif (minggu ke-${currentWeek}). Silakan selesaikan hingga minggu ke-12 terlebih dahulu sebelum memulai kohort baru.`,
          { status: 400 }
        );
      }
    } else {
      // No monitoring data means cohort just started
      return new Response(
        "Balita sudah memiliki kohort yang sedang berjalan. Silakan selesaikan intervensi saat ini terlebih dahulu sebelum memulai kohort baru.",
        { status: 400 }
      );
    }
  }

  // All constraints passed, proceed with cohort creation

  const { error: insertError } = await supabase.from("kohort").insert({
    balita_id,
    puskesmas_id,
    periode_mulai,
  });
  if (insertError) return new Response(insertError.message, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const appUser = await getAppUser();
  if (!appUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const { kohort_id, periode_mulai } = body;
  if (!kohort_id || !periode_mulai) {
    return new Response("Data kurang (kohort_id dan periode_mulai wajib diisi)", { status: 400 });
  }

  // Check existence & permissions
  const { data: kohort, error: fetchErr } = await supabase
    .from("kohort")
    .select("id, puskesmas_id")
    .eq("id", kohort_id)
    .maybeSingle();

  if (fetchErr || !kohort) {
    return new Response("Kohort tidak ditemukan", { status: 444 });
  }

  if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    if (kohort.puskesmas_id !== appUser.puskesmas_id) {
      return new Response("Akses ditolak (Puskesmas berbeda)", { status: 403 });
    }
  }

  const { error: updateErr } = await supabase
    .from("kohort")
    .update({ periode_mulai })
    .eq("id", kohort_id);

  if (updateErr) {
    return new Response(updateErr.message, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Tanggal mulai kohort berhasil diperbarui" });
}
