import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  // Terima Bearer token jika dikirim klien, fallback cookie
  let user: any = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) user = data.user;
    } catch {}
  }
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  if (!user) return new Response("Unauthorized", { status: 401 });

  const appUser = await getAppUser();
  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body?.id ?? undefined;
  const nik: string | undefined = body?.nik ?? undefined;
  const isUuid = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  const payload: any = {
    nik: body.nik ?? undefined,
    nama_balita: body.nama_balita ?? undefined,
    jk: body.jk ?? undefined,
    tgl_lahir: body.tgl_lahir ?? undefined,
    bb_lahir_kg: body.bb_lahir_kg === '' || body.bb_lahir_kg == null ? null : Number(body.bb_lahir_kg),
    tb_lahir_cm: body.tb_lahir_cm === '' || body.tb_lahir_cm == null ? null : Number(body.tb_lahir_cm),
    nama_ortu: body.nama_ortu ?? undefined,
    kab_kota: body.kab_kota ?? undefined,
    kec: body.kec ?? undefined,
    desa_kel: body.desa_kel ?? undefined,
    posyandu: body.posyandu ?? undefined,
    rt: body.rt ?? undefined,
    rw: body.rw ?? undefined,
    alamat: body.alamat ?? undefined,
    bb_tidak_adekuat: body.bb_tidak_adekuat ?? undefined,
    murmur_edema: body.murmur_edema ?? undefined,
    delayed_development: body.delayed_development ?? undefined,
    wajah_dismorfik: body.wajah_dismorfik ?? undefined,
    organomegali_limfadenopati: body.organomegali_limfadenopati ?? undefined,
    ispa_cystitis: body.ispa_cystitis ?? undefined,
    muntah_diare_berulang: body.muntah_diare_berulang ?? undefined,
    diagnosa_penyakit_penyerta: body.diagnosa_penyakit_penyerta ?? undefined,
    keterangan_redflag: body.keterangan_redflag ?? undefined,
  };
  if (appUser?.role !== 'admin_puskesmas' && body.puskesmas_id) {
    payload.puskesmas_id = body.puskesmas_id;
  }

  let q = supabase.from('balita').update(payload);
  if (isUuid(id)) q = q.eq('id', id as string);
  else if (nik) q = q.eq('nik', nik);
  else return new Response('id atau nik wajib diisi', { status: 400 });
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    q = q.eq('puskesmas_id', appUser.puskesmas_id);
  }
  const { error } = await q;
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
