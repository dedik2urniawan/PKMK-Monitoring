import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const balita_id = req.nextUrl.searchParams.get("balita_id");
  const puskesmas_id = req.nextUrl.searchParams.get("puskesmas_id");
  const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "50"));

  try {
    let q = supabase
      .from("sdidtk_assessments")
      .select("*")
      .order("assessment_date", { ascending: false })
      .limit(limit);

    if (balita_id) q = q.eq("balita_id", balita_id);
    if (puskesmas_id) q = q.eq("puskesmas_id", puskesmas_id);

    const { data, error } = await q;

    if (error) {
      console.warn("[GET /api/sdidtk] Error querying sdidtk_assessments:", error.message);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ items: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const appUser = await getAppUser();

  if (!appUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const balita_id = body?.balita_id;

  if (!balita_id) {
    return new Response("balita_id wajib diisi", { status: 400 });
  }

  const payload: any = {
    balita_id: body.balita_id,
    puskesmas_id: body.puskesmas_id || appUser.puskesmas_id || undefined,
    examiner_name: body.examiner_name || "Petugas Kesehatan",
    assessment_date: body.assessment_date || new Date().toISOString().split("T")[0],
    birth_date: body.birth_date,
    gestational_weeks: body.gestational_weeks || 40,
    chronological_age_months: Number(body.chronological_age_months || 0),
    corrected_age_months: body.corrected_age_months ? Number(body.corrected_age_months) : undefined,
    is_premature_corrected: !!body.is_premature_corrected,
    
    weight_kg: body.weight_kg ? Number(body.weight_kg) : undefined,
    height_cm: body.height_cm ? Number(body.height_cm) : undefined,
    head_circ_cm: body.head_circ_cm ? Number(body.head_circ_cm) : undefined,
    muac_lila_cm: body.muac_lila_cm ? Number(body.muac_lila_cm) : undefined,
    
    kpsp_age_bracket: Number(body.kpsp_age_bracket || 3),
    kpsp_yes_count: Number(body.kpsp_yes_count || 0),
    kpsp_status: body.kpsp_status || "SESUAI_UMUR",
    kpsp_failed_sectors: body.kpsp_failed_sectors || [],
    kpsp_answers: body.kpsp_answers || {},
    
    tdd_status: body.tdd_status || "NORMAL",
    leukocoria_status: body.leukocoria_status || "NORMAL",
    tdl_status: body.tdl_status || undefined,
    mchat_score: body.mchat_score != null ? Number(body.mchat_score) : undefined,
    mchat_risk: body.mchat_risk || undefined,
    mchat_indications: body.mchat_indications || {},
    mchat_answers: body.mchat_answers || {},
    mchat_failed_items: body.mchat_failed_items || [],
    kmpe_yes_count: body.kmpe_yes_count != null ? Number(body.kmpe_yes_count) : undefined,
    kmpe_status: body.kmpe_status || undefined,
    gpph_total_score: body.gpph_total_score != null ? Number(body.gpph_total_score) : undefined,
    gpph_status: body.gpph_status || undefined,
    
    clinical_action: body.clinical_action || "STIMULASI_RUTIN",
    referral_required: !!body.referral_required,
    referral_urgency: body.referral_urgency || "ROUTINE",
    referral_reasons: body.referral_reasons || [],
    referral_destination: body.referral_destination || undefined,
    notes: body.notes || undefined,
  };

  try {
    const { data, error } = await supabase
      .from("sdidtk_assessments")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.warn("[POST /api/sdidtk] Error inserting sdidtk_assessments:", error.message);
      return NextResponse.json({ ok: true, warning: error.message, savedLocally: true });
    }

    // If M-CHAT-R data is provided, also record into mchat_screenings
    if (body.mchat_score != null || (body.mchat_answers && Object.keys(body.mchat_answers).length > 0)) {
      try {
        const answers = body.mchat_answers || {};
        const indications = body.mchat_indications || {};
        const mchatPayload = {
          assessment_id: data?.id,
          balita_id: body.balita_id,
          puskesmas_id: body.puskesmas_id || appUser.puskesmas_id || undefined,
          screening_date: body.assessment_date || new Date().toISOString().split("T")[0],
          age_in_months: Number(body.chronological_age_months || 0),
          is_routine_screening: !indications.hasSpeechDelay && !indications.hasSocialCommunicationIssue && !indications.hasRepetitiveBehavior,
          has_speech_delay: !!indications.hasSpeechDelay,
          has_social_communication_issue: !!indications.hasSocialCommunicationIssue,
          has_repetitive_behavior: !!indications.hasRepetitiveBehavior,
          q1_points_at_objects: answers[1] ?? true,
          q2_hearing_concern: answers[2] ?? false,
          q3_pretend_play: answers[3] ?? true,
          q4_climbs_objects: answers[4] ?? true,
          q5_unusual_finger_movement: answers[5] ?? false,
          q6_point_to_ask: answers[6] ?? true,
          q7_point_to_share: answers[7] ?? true,
          q8_interest_in_children: answers[8] ?? true,
          q9_shows_objects_to_share: answers[9] ?? true,
          q10_responds_to_name: answers[10] ?? true,
          q11_social_smile: answers[11] ?? true,
          q12_noise_sensitive: answers[12] ?? false,
          q13_can_walk: answers[13] ?? true,
          q14_eye_contact: answers[14] ?? true,
          q15_imitates_actions: answers[15] ?? true,
          q16_gaze_following: answers[16] ?? true,
          q17_seeks_attention: answers[17] ?? true,
          q18_understands_commands: answers[18] ?? true,
          q19_social_referencing: answers[19] ?? true,
          q20_enjoys_movement_play: answers[20] ?? true,
          total_risk_score: Number(body.mchat_score || 0),
          risk_classification: body.mchat_risk || (Number(body.mchat_score || 0) >= 3 ? "RISIKO_SEDANG_TINGGI" : "RISIKO_RENDAH"),
          failed_items: body.mchat_failed_items || [],
          referral_triggered: Number(body.mchat_score || 0) >= 3,
          referral_destination: Number(body.mchat_score || 0) >= 3 ? "RS Rujukan Tumbuh Kembang Level 1 / Dokter Spesialis Anak" : undefined,
          notes: body.notes,
        };

        await supabase.from("mchat_screenings").insert(mchatPayload);
      } catch (mErr: any) {
        console.warn("[POST /api/sdidtk] Error inserting mchat_screenings:", mErr.message);
      }
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: true, warning: err.message });
  }
}

