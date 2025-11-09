import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const appUser = await getAppUser();
  const id = req.nextUrl.searchParams.get("id") || "";
  const nik = req.nextUrl.searchParams.get("nik") || "";

  const selectCols = [
    "id","nik","nama_balita","jk","tgl_lahir","bb_lahir_kg","tb_lahir_cm",
    "nama_ortu","kab_kota","kec","desa_kel","posyandu","rt","rw","alamat",
    "puskesmas_id","sumber_data",
    "bb_tidak_adekuat","murmur_edema","delayed_development","wajah_dismorfik",
    "organomegali_limfadenopati","ispa_cystitis","muntah_diare_berulang"
  ].join(", ");

  async function byId(uuid: string) {
    if (!uuid) return null;
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      const scoped = await supabase
        .from("balita")
        .select(selectCols)
        .eq("id", uuid)
        .eq('puskesmas_id', appUser.puskesmas_id)
        .maybeSingle();
      if (scoped.error && scoped.error.code !== 'PGRST116') throw scoped.error;
      if (scoped.data) return scoped.data as any;
    }
    const plain = await supabase.from('balita').select(selectCols).eq('id', uuid).maybeSingle();
    if (plain.error && plain.error.code !== 'PGRST116') throw plain.error;
    return plain.data || null;
  }

  async function byNik(n: string) {
    if (!n) return null;
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      const scoped = await supabase
        .from('balita')
        .select(selectCols)
        .eq('nik', n)
        .eq('puskesmas_id', appUser.puskesmas_id)
        .maybeSingle();
      if (scoped.error && scoped.error.code !== 'PGRST116') throw scoped.error;
      if (scoped.data) return scoped.data as any;
    }
    const plain = await supabase.from('balita').select(selectCols).eq('nik', n).maybeSingle();
    if (plain.error && plain.error.code !== 'PGRST116') throw plain.error;
    return plain.data || null;
  }

  let row = await byId(id);
  if (!row) row = await byNik(nik);
  if (!row && nik) {
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      const scoped = await supabase
        .from('balita')
        .select(selectCols)
        .ilike('nik', `%${nik}%`)
        .eq('puskesmas_id', appUser.puskesmas_id)
        .maybeSingle();
      if (scoped.error && scoped.error.code !== 'PGRST116') throw scoped.error;
      if (scoped.data) row = scoped.data as any;
    }
    if (!row) {
      const plain = await supabase
        .from('balita')
        .select(selectCols)
        .ilike('nik', `%${nik}%`)
        .maybeSingle();
      if (plain.error && plain.error.code !== 'PGRST116') throw plain.error;
      row = plain.data || null;
    }
  }

  if (!row) return new Response("Not found", { status: 404 });
  // Tambahkan nama puskesmas
  try {
    if (row.puskesmas_id) {
      const { data: pkm } = await supabase
        .from('ref_puskesmas')
        .select('nama')
        .eq('id', row.puskesmas_id)
        .maybeSingle();
      (row as any).puskesmas_nama = pkm?.nama ?? null;
    }
  } catch {}
  return NextResponse.json({ item: row });
}
