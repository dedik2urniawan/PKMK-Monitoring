import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

    const desa_id = req.nextUrl.searchParams.get('desa_id');
    const puskesmas_id = req.nextUrl.searchParams.get('puskesmas_id');
    const nik = req.nextUrl.searchParams.get('nik');
    const desa_kel = req.nextUrl.searchParams.get('desa_kel');
    const kec = req.nextUrl.searchParams.get('kec');

    // Pagination params
    const page = Number(req.nextUrl.searchParams.get('page') || '1');
    const limit = Math.max(1, Number(req.nextUrl.searchParams.get('limit') || '10'));

    // Read user from Authorization header
    const authHeader = req.headers.get('authorization');
    let appUser: { role: string; puskesmas_id: string | null } | null = null;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const jwt = authHeader.slice(7).trim();
        const decoded = decodeJWT(jwt);

        if (decoded && decoded.exp > Math.floor(Date.now() / 1000)) {
            const userId = decoded.sub;
            const userEmail = decoded.email;

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

    // Build base query for count
    const base = supabase.from('balita');
    let qFilter = base.select('id', { count: 'exact', head: true });
    let qData = base.select('*').order('nama_balita', { ascending: true });

    // Role-based filtering
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
        qFilter = qFilter.eq('puskesmas_id', appUser.puskesmas_id);
        qData = qData.eq('puskesmas_id', appUser.puskesmas_id);
    } else if (appUser?.role === 'superadmin') {
        if (puskesmas_id) {
            qFilter = qFilter.eq('puskesmas_id', puskesmas_id);
            qData = qData.eq('puskesmas_id', puskesmas_id);
        }
    } else if (puskesmas_id) {
        qFilter = qFilter.eq('puskesmas_id', puskesmas_id);
        qData = qData.eq('puskesmas_id', puskesmas_id);
    }

    // Apply additional filters to both queries
    if (kec) {
        qFilter = qFilter.eq('kec', kec);
        qData = qData.eq('kec', kec);
    }
    if (desa_id) {
        qFilter = qFilter.eq('desa_id', desa_id);
        qData = qData.eq('desa_id', desa_id);
    }
    if (desa_kel) {
        qFilter = qFilter.eq('desa_kel', desa_kel);
        qData = qData.eq('desa_kel', desa_kel);
    }
    if (nik) {
        qFilter = qFilter.ilike('nik', `%${nik}%`);
        qData = qData.ilike('nik', `%${nik}%`);
    }

    // Get count first
    const { count, error: countError } = await qFilter;
    if (countError) {
        console.error('[determinan/balita-list] Count Error:', countError);
        return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const total = count ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data: balitaData, error: balitaError } = await qData.range(from, to);

    if (balitaError) {
        console.error('[determinan/balita-list] Error:', balitaError);
        return NextResponse.json({ error: balitaError.message }, { status: 500 });
    }

    // Get survey data for fetched balita only (use admin client to bypass RLS)
    const balitaIds = balitaData?.map(b => b.id) || [];

    let surveyData: any[] = [];
    if (balitaIds.length > 0) {
        const adminClient = createAdminClient();
        const { data } = await adminClient
            .from('survey_determinan')
            .select('balita_id, tanggal_survey, risk_category')
            .in('balita_id', balitaIds)
            .order('tanggal_survey', { ascending: false });
        surveyData = data || [];
    }

    // Map survey data to balita
    const surveyMap = new Map<string, { count: number; latestDate: string | null; latestRisk: string | null }>();
    surveyData.forEach(s => {
        const existing = surveyMap.get(s.balita_id);
        if (!existing) {
            surveyMap.set(s.balita_id, {
                count: 1,
                latestDate: s.tanggal_survey,
                latestRisk: s.risk_category
            });
        } else {
            surveyMap.set(s.balita_id, {
                ...existing,
                count: existing.count + 1
            });
        }
    });

    // Transform data
    const items = (balitaData || []).map((b: any) => ({
        id: b.id,
        nik: b.nik || '-',
        nama: b.nama_balita || '-',
        tanggal_lahir: b.tgl_lahir,
        jenis_kelamin: b.jk,
        desa_id: b.desa_id,
        desa_nama: b.desa_kel || '-',
        puskesmas_id: b.puskesmas_id,
        puskesmas_nama: b.puskesmas || '-',
        kecamatan_nama: b.kec || '-',
        survey_count: surveyMap.get(b.id)?.count || 0,
        latest_survey_date: surveyMap.get(b.id)?.latestDate || null,
        latest_risk_category: surveyMap.get(b.id)?.latestRisk || null,
    }));

    return NextResponse.json({ items, page, pages, total, limit });
}
