import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET() {
  const supabase = await createClient();
  const appUser = await getAppUser();
  let q = supabase.from('balita').select('id,nama_balita').order('nama_balita')
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    q = q.eq('puskesmas_id', appUser.puskesmas_id)
  }
  const { data, error } = await q
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: uerr,
  } = await supabase.auth.getUser();
  if (uerr || !user) return new Response("Unauthorized", { status: 401 });

  const meta = (user.user_metadata || {}) as any;
  let puskesmas_id = meta.puskesmas_id ?? null;
  const appUser = await getAppUser();

  const body = await req.json();
  if (!body?.nama_balita || !body?.jk || !body?.tgl_lahir) {
    return new Response("Field wajib belum lengkap", { status: 400 });
  }

  // Role-based resolution for puskesmas_id
  if (appUser?.role === 'admin_puskesmas') {
    puskesmas_id = appUser.puskesmas_id ?? puskesmas_id;
  } else {
    // superadmin may specify via body
    if (!puskesmas_id && body?.puskesmas_id) {
      puskesmas_id = body.puskesmas_id;
    }
  }
  if (!puskesmas_id) {
    return new Response(
      "puskesmas_id tidak ditemukan (set di user_metadata atau kirim via body)",
      { status: 400 }
    );
  }

  const insertPayload = {
    nik: body.nik || null,
    nama_balita: body.nama_balita,
    jk: body.jk,
    tgl_lahir: body.tgl_lahir,
    nama_ortu: body.nama_ortu || null,
    kab_kota: body.kab_kota || null,
    kec: body.kec || null,
    desa_kel: body.desa_kel || null,
    posyandu: body.posyandu || null,
    rt: body.rt || null,
    rw: body.rw || null,
    alamat: body.alamat || null,
    bb_lahir_kg: body.bb_lahir_kg ?? null,
    tb_lahir_cm: body.tb_lahir_cm ?? null,
    // redflag fields (optional, values 'ya'|'tidak')
    bb_tidak_adekuat: body.bb_tidak_adekuat ?? null,
    murmur_edema: body.murmur_edema ?? null,
    delayed_development: body.delayed_development ?? null,
    wajah_dismorfik: body.wajah_dismorfik ?? null,
    organomegali_limfadenopati: body.organomegali_limfadenopati ?? null,
    ispa_cystitis: body.ispa_cystitis ?? null,
    muntah_diare_berulang: body.muntah_diare_berulang ?? null,
    diagnosa_penyakit_penyerta: body.diagnosa_penyakit_penyerta ?? null,
    keterangan_redflag: body.keterangan_redflag ?? null,
    puskesmas_id: puskesmas_id,
    sumber_data: "input",
  } as const;

  const { error } = await supabase.from("balita").insert(insertPayload as any);
  if (error) return new Response(error.message, { status: 400 });

  return NextResponse.json({ ok: true });
}
