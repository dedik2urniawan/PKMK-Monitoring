import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  if (!body?.kohort_id || !body?.minggu_ke || !body?.tanggal || !body?.cara_ukur) {
    return new Response("Data kurang", { status: 400 });
  }
  const { error } = await supabase.from("monitoring_antropometri").insert({
    kohort_id: body.kohort_id,
    minggu_ke: body.minggu_ke,
    tanggal: body.tanggal,
    cara_ukur: body.cara_ukur,
    usia_bulan: body.usia_bulan ?? null,
    bb_kg: body.bb_kg ?? null,
    tb_cm: body.tb_cm ?? null,
    tb_corr_cm: body.tb_corr_cm ?? null,
    lila_cm: body.lila_cm ?? null,
    zs_bbu: body.zs_bbu ?? null,
    zs_tbu: body.zs_tbu ?? null,
    zs_bbtb: body.zs_bbtb ?? null,
    klas_bbu: body.klas_bbu ?? null,
    klas_tbu: body.klas_tbu ?? null,
    klas_bbtb: body.klas_bbtb ?? null,
    delta_bb_kg: body.delta_bb_kg ?? null,
    // Redflag + SOAP (opsional)
    bb_tidak_adekuat: body.bb_tidak_adekuat ?? null,
    murmur_edema: body.murmur_edema ?? null,
    delayed_development: body.delayed_development ?? null,
    wajah_dismorfik: body.wajah_dismorfik ?? null,
    organomegali_limfadenopati: body.organomegali_limfadenopati ?? null,
    ispa_cystitis: body.ispa_cystitis ?? null,
    muntah_diare_berulang: body.muntah_diare_berulang ?? null,
    diagnosa_penyakit_penyerta: body.diagnosa_penyakit_penyerta ?? null,
    subjective: body.subjective ?? null,
    objective: body.objective ?? null,
    assesment: body.assesment ?? null,
    plan: body.plan ?? null,
  });
  if (error) return new Response(error.message, { status: 400 });
  return new Response("OK");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const kohort_id = req.nextUrl.searchParams.get("kohort_id");
  if (!kohort_id) return new Response("kohort_id required", { status: 400 });
  const { data, error } = await supabase
    .from("monitoring_antropometri")
    .select("id, minggu_ke, tanggal, cara_ukur, usia_bulan, bb_kg, tb_cm, tb_corr_cm, lila_cm, zs_bbu, zs_tbu, zs_bbtb, klas_bbu, klas_tbu, klas_bbtb, delta_bb_kg, bb_tidak_adekuat, murmur_edema, delayed_development, wajah_dismorfik, organomegali_limfadenopati, ispa_cystitis, muntah_diare_berulang, diagnosa_penyakit_penyerta, subjective, objective, assesment, plan")
    .eq("kohort_id", kohort_id)
    .order("minggu_ke", { ascending: false })
    .order("tanggal", { ascending: false });
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { id, ...fields } = body || {};
  if (!id) return new Response("id required", { status: 400 });
  const { error } = await supabase
    .from("monitoring_antropometri")
    .update({
      minggu_ke: fields.minggu_ke,
      tanggal: fields.tanggal,
      cara_ukur: fields.cara_ukur,
      usia_bulan: fields.usia_bulan ?? null,
      bb_kg: fields.bb_kg ?? null,
      tb_cm: fields.tb_cm ?? null,
      tb_corr_cm: fields.tb_corr_cm ?? null,
      lila_cm: fields.lila_cm ?? null,
      zs_bbu: fields.zs_bbu ?? null,
      zs_tbu: fields.zs_tbu ?? null,
      zs_bbtb: fields.zs_bbtb ?? null,
      klas_bbu: fields.klas_bbu ?? null,
      klas_tbu: fields.klas_tbu ?? null,
      klas_bbtb: fields.klas_bbtb ?? null,
      delta_bb_kg: fields.delta_bb_kg ?? null,
      // Redflag + SOAP
      bb_tidak_adekuat: fields.bb_tidak_adekuat ?? null,
      murmur_edema: fields.murmur_edema ?? null,
      delayed_development: fields.delayed_development ?? null,
      wajah_dismorfik: fields.wajah_dismorfik ?? null,
      organomegali_limfadenopati: fields.organomegali_limfadenopati ?? null,
      ispa_cystitis: fields.ispa_cystitis ?? null,
      muntah_diare_berulang: fields.muntah_diare_berulang ?? null,
      diagnosa_penyakit_penyerta: fields.diagnosa_penyakit_penyerta ?? null,
      subjective: fields.subjective ?? null,
      objective: fields.objective ?? null,
      assesment: fields.assesment ?? null,
      plan: fields.plan ?? null,
    })
    .eq("id", id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("OK");
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  let id: string | null = null;
  try { const b = await req.json(); id = b?.id ?? null; } catch {}
  if (!id) id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });
  const { error } = await supabase.from("monitoring_antropometri").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("OK");
}
