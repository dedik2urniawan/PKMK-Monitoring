import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const puskesmas_id = req.nextUrl.searchParams.get("puskesmas_id");
  const appUser = await getAppUser();
  let q = supabase.from("ref_desa").select("id,desa_kel,puskesmas_id").order("desa_kel");
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    q = q.eq('puskesmas_id', appUser.puskesmas_id);
  } else if (puskesmas_id) {
    q = q.eq("puskesmas_id", puskesmas_id);
  }
  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}
