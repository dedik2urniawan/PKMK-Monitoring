import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const kec = req.nextUrl.searchParams.get("kec") || req.nextUrl.searchParams.get("kecamatan");
  const appUser = await getAppUser();
  let q = supabase.from("ref_puskesmas").select("id,nama,kecamatan").order("nama");
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    q = q.eq('id', appUser.puskesmas_id);
  } else if (kec) {
    q = q.eq("kecamatan", kec);
  }
  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}
