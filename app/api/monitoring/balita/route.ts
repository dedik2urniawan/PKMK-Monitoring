import { NextRequest, NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Helper to decode JWT payload
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const puskesmas_id = req.nextUrl.searchParams.get("puskesmas_id");
  const desa_kel = req.nextUrl.searchParams.get("desa_kel");
  const nik = req.nextUrl.searchParams.get("nik");
  const balita_id = req.nextUrl.searchParams.get("balita_id");
  const kec = req.nextUrl.searchParams.get("kec") || req.nextUrl.searchParams.get("kecamatan");
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const limit = Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "10"));

  // DEBUG: Log ALL received headers
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = key.toLowerCase().includes('auth') ? value.slice(0, 30) + '...' : value.slice(0, 50);
  });
  console.log('[monitoring/balita] ALL headers:', JSON.stringify(allHeaders, null, 2));

  // DIRECT: Read Authorization header from request
  const authHeader = req.headers.get('authorization');
  console.log('[monitoring/balita] Auth header present:', !!authHeader, 'length:', authHeader?.length || 0);

  let appUser: { role: string; puskesmas_id: string | null } | null = null;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const jwt = authHeader.slice(7).trim();
    const decoded = decodeJWT(jwt);

    if (decoded && decoded.exp > Math.floor(Date.now() / 1000)) {
      const userId = decoded.sub;
      const userEmail = decoded.email;
      console.log('[monitoring/balita] JWT decoded:', { userId, userEmail });

      // Lookup in app_users
      const { data } = await supabase
        .from('app_users')
        .select('role, puskesmas_id')
        .or(`id.eq.${userId},email.eq.${userEmail}`)
        .maybeSingle();

      if (data) {
        appUser = { role: data.role, puskesmas_id: data.puskesmas_id };
      }
    }
  }

  console.log('[monitoring/balita] User:', { role: appUser?.role, puskesmas_id: appUser?.puskesmas_id });

  const created_from = req.nextUrl.searchParams.get("created_from");
  const created_to = req.nextUrl.searchParams.get("created_to");
  const sort_order = req.nextUrl.searchParams.get("sort_order") || "nama";

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
  `);

  // Apply order based on sort_order parameter
  if (sort_order === "newest") {
    qData = qData.order("created_at", { ascending: false, nullsFirst: false });
  } else if (sort_order === "oldest") {
    qData = qData.order("created_at", { ascending: true, nullsFirst: false });
  } else {
    qData = qData.order("nama_balita", { ascending: true });
  }

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
  if (created_from) {
    qFilter = qFilter.gte("created_at", created_from);
    qData = qData.gte("created_at", created_from);
  }
  if (created_to) {
    const endOfDay = `${created_to}T23:59:59.999Z`;
    qFilter = qFilter.lte("created_at", endOfDay);
    qData = qData.lte("created_at", endOfDay);
  }

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
