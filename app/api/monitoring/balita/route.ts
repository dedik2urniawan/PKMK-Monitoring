import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const puskesmas_id = req.nextUrl.searchParams.get("puskesmas_id");
  const desa_kel = req.nextUrl.searchParams.get("desa_kel");
  const nik = req.nextUrl.searchParams.get("nik");
  const balita_id = req.nextUrl.searchParams.get("balita_id");
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "10"));

  // Base query builder
  const base = supabase.from("balita");
  // Build filter once
  let qFilter = base.select("id", { count: 'exact', head: true });
  let qData = base.select("*").order("nama_balita");

  const appUser = await getAppUser();
  if (balita_id) { qFilter = qFilter.eq("id", balita_id); qData = qData.eq("id", balita_id); }
  // Enforce role-based scoping
  if (appUser?.role === 'admin_puskesmas') {
    if (appUser.puskesmas_id) { qFilter = qFilter.eq('puskesmas_id', appUser.puskesmas_id); qData = qData.eq('puskesmas_id', appUser.puskesmas_id); }
  } else if (puskesmas_id) {
    qFilter = qFilter.eq('puskesmas_id', puskesmas_id); qData = qData.eq('puskesmas_id', puskesmas_id)
  }
  if (desa_kel) { qFilter = qFilter.eq("desa_kel", desa_kel); qData = qData.eq("desa_kel", desa_kel); }
  if (nik) { qFilter = qFilter.ilike("nik", `%${nik}%`); qData = qData.ilike("nik", `%${nik}%`); }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  // Count first, then fetch page
  const { count, error: cErr } = await qFilter;
  if (cErr) return new Response(cErr.message, { status: 400 });
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  const { data, error } = await qData.range(from, to);
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ items: data ?? [], page, pages, total, limit });
}
