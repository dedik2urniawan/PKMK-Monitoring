import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const id = params.id;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) return new Response("Invalid id", { status: 400 });

  const { error } = await supabase.from("balita").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const appUser = await getAppUser();
  const id = decodeURIComponent(params.id || '').trim();
  if (!id) return new Response("Invalid id", { status: 400 });

  const body = await req.json().catch(() => ({}));
  // Build payload (only allowed fields)
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
    // redflags
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
  // puskesmas_id hanya bisa diubah oleh superadmin
  if (appUser?.role !== 'admin_puskesmas' && body.puskesmas_id) {
    payload.puskesmas_id = body.puskesmas_id;
  }

  let q = supabase.from('balita').update(payload).eq('id', id);
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    q = q.eq('puskesmas_id', appUser.puskesmas_id);
  }
  const { error } = await q;
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}
