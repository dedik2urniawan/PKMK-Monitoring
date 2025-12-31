import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const puskesmas_id = req.nextUrl.searchParams.get("puskesmas_id");
  const desa_kel = req.nextUrl.searchParams.get("desa_kel");
  const nik = req.nextUrl.searchParams.get("nik");
  const balita_id = req.nextUrl.searchParams.get("balita_id");
  const kec = req.nextUrl.searchParams.get("kec") || req.nextUrl.searchParams.get("kecamatan");
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "10"));

  // Get user info for role-based filtering
  const appUser = await getAppUser();
  console.log('[monitoring/balita] User:', { role: appUser?.role, puskesmas_id: appUser?.puskesmas_id });

  // Base query builder
  const base = supabase.from("balita");
  let qFilter = base.select("id", { count: 'exact', head: true });
  let qData = base.select(`
    *,
    kohort (
      *,
      monitoring_antropometri (*),
      monitoring_pkmk_konsumsi (*),
      monitoring_pkmk_pemberian (*)
    )
  `)
    .order("nama_balita");

  // Apply balita_id filter first (specific lookup)
  if (balita_id) { qFilter = qFilter.eq("id", balita_id); qData = qData.eq("id", balita_id); }

  // Role-based filtering - ALWAYS apply for admin_puskesmas
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    // Admin puskesmas: FORCE filter by their puskesmas_id
    console.log('[monitoring/balita] Filtering for admin_puskesmas:', appUser.puskesmas_id);
    qFilter = qFilter.eq('puskesmas_id', appUser.puskesmas_id);
    qData = qData.eq('puskesmas_id', appUser.puskesmas_id);
  } else if (appUser?.role === 'superadmin') {
    // Superadmin: apply optional filter from query param
    if (puskesmas_id) {
      console.log('[monitoring/balita] Superadmin filtering by selected puskesmas:', puskesmas_id);
      qFilter = qFilter.eq('puskesmas_id', puskesmas_id);
      qData = qData.eq('puskesmas_id', puskesmas_id);
    }
  } else if (puskesmas_id) {
    // Fallback: if user role unknown but puskesmas_id provided, still filter
    console.log('[monitoring/balita] Fallback filter by puskesmas_id:', puskesmas_id);
    qFilter = qFilter.eq('puskesmas_id', puskesmas_id);
    qData = qData.eq('puskesmas_id', puskesmas_id);
  }
  if (kec) { qFilter = qFilter.eq("kec", kec); qData = qData.eq("kec", kec); }
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
