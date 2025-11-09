import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET() {
  const supabase = await createClient();
  const appUser = await getAppUser();
  let data: any[] = [];
  let error: any = null;
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    const r = await supabase.from('ref_puskesmas').select('kecamatan').eq('id', appUser.puskesmas_id).maybeSingle();
    if (r.error) error = r.error; else data = r.data ? [r.data] : [];
  } else {
    const r = await supabase.from('ref_puskesmas').select('kecamatan').order('kecamatan');
    if (r.error) error = r.error; else data = r.data || [];
  }
  if (error) return new Response(error.message, { status: 400 });
  const items = Array.from(new Set((data ?? []).map((r: any) => r.kecamatan))).filter(Boolean);
  return NextResponse.json({ items });
}
