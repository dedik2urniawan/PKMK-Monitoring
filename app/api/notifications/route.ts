import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/lib/supabase/server';
import { getAuthHeaders } from '@/lib/clientSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

interface Notification {
    id: string;
    type: 'stok_habis' | 'stok_menipis' | 'monitoring_overdue' | 'kohort_pending' | 'redflag';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    link: string;
    timestamp: string;
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // Read auth from request headers
    const authHeader = req.headers.get('authorization');
    let user: { role: string; puskesmas_id: string | null } | null = null;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const jwt = authHeader.slice(7).trim();
        const decoded = decodeJWT(jwt);

        if (decoded && decoded.exp > Math.floor(Date.now() / 1000)) {
            const userId = decoded.sub;
            const { data } = await supabase
                .from('app_users')
                .select('role, puskesmas_id')
                .or(`id.eq.${userId},email.eq.${decoded.email}`)
                .maybeSingle();

            if (data) {
                user = { role: data.role, puskesmas_id: data.puskesmas_id };
            }
        }
    }

    if (!user) {
        return NextResponse.json({ notifications: [], count: 0 });
    }

    const notifications: Notification[] = [];

    // 1. STOK MENIPIS/HABIS
    try {
        let stokQuery = supabase
            .from('logistik_stok_puskesmas')
            .select(`
        id,
        puskesmas_id,
        stok_tersedia,
        stok_minimum,
        updated_at,
        ref_puskesmas:puskesmas_id (nama),
        ref_jenis_pkmk:jenis_pkmk_id (nama_merk)
      `);

        if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
            stokQuery = stokQuery.eq('puskesmas_id', user.puskesmas_id);
        }

        const { data: stokItems } = await stokQuery;

        (stokItems || [])
            .filter((item: any) => item.stok_tersedia <= 0 || item.stok_tersedia <= (item.stok_minimum ?? 10))
            .forEach((item: any) => {
                const isHabis = item.stok_tersedia <= 0;
                notifications.push({
                    id: `stok-${item.id}`,
                    type: isHabis ? 'stok_habis' : 'stok_menipis',
                    title: isHabis ? '🚨 Stok Habis' : '⚠️ Stok Menipis',
                    message: `${item.ref_jenis_pkmk?.nama_merk || 'PKMK'} di ${item.ref_puskesmas?.nama || 'Puskesmas'} (${item.stok_tersedia} tersisa)`,
                    priority: isHabis ? 'high' : 'medium',
                    link: '/logistik',
                    timestamp: item.updated_at
                });
            });
    } catch (e) { console.error('[notifications] stok error:', e); }

    // 2. MONITORING OVERDUE (kohort aktif tanpa monitoring 7 hari terakhir)
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let kohortQuery = supabase
            .from('kohort')
            .select(`
        id,
        balita_id,
        puskesmas_id,
        periode_mulai,
        periode_selesai,
        balita:balita_id (nama_balita),
        ref_puskesmas:puskesmas_id (nama),
        monitoring_antropometri (tanggal)
      `)
            .is('periode_selesai', null); // Active cohorts only

        if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
            kohortQuery = kohortQuery.eq('puskesmas_id', user.puskesmas_id);
        }

        const { data: kohortItems } = await kohortQuery.limit(20);

        (kohortItems || []).forEach((item: any) => {
            const monitoringDates = (item.monitoring_antropometri || []).map((m: any) => new Date(m.tanggal));
            const lastMonitoring = monitoringDates.length > 0 ? Math.max(...monitoringDates.map((d: Date) => d.getTime())) : null;

            if (!lastMonitoring || lastMonitoring < sevenDaysAgo.getTime()) {
                const daysSince = lastMonitoring
                    ? Math.floor((Date.now() - lastMonitoring) / (1000 * 60 * 60 * 24))
                    : null;

                notifications.push({
                    id: `overdue-${item.id}`,
                    type: 'monitoring_overdue',
                    title: '📊 Monitoring Tertunda',
                    message: daysSince
                        ? `${item.balita?.nama_balita || 'Balita'} belum monitoring ${daysSince} hari`
                        : `${item.balita?.nama_balita || 'Balita'} belum ada monitoring`,
                    priority: 'medium',
                    link: `/monitoring/${item.balita_id}/antropometri/new`,
                    timestamp: item.periode_mulai
                });
            }
        });
    } catch (e) { console.error('[notifications] monitoring overdue error:', e); }

    // 3. REDFLAG CASES
    try {
        let redflagQuery = supabase
            .from('monitoring_antropometri')
            .select(`
        id,
        kohort_id,
        tanggal,
        bb_tidak_adekuat,
        murmur_edema,
        delayed_development,
        wajah_dismorfik,
        organomegali_limfadenopati,
        ispa_cystitis,
        muntah_diare_berulang,
        kohort:kohort_id (
          balita_id,
          puskesmas_id,
          balita:balita_id (nama_balita)
        )
      `)
            .or('bb_tidak_adekuat.ilike.%ya%,murmur_edema.ilike.%ya%,delayed_development.ilike.%ya%,wajah_dismorfik.ilike.%ya%,organomegali_limfadenopati.ilike.%ya%,ispa_cystitis.ilike.%ya%,muntah_diare_berulang.ilike.%ya%')
            .order('tanggal', { ascending: false })
            .limit(10);

        const { data: redflagItems } = await redflagQuery;

        // Filter by puskesmas if admin_puskesmas
        const filteredRedflags = user.role === 'admin_puskesmas' && user.puskesmas_id
            ? (redflagItems || []).filter((item: any) => item.kohort?.puskesmas_id === user.puskesmas_id)
            : (redflagItems || []);

        filteredRedflags.slice(0, 5).forEach((item: any) => {
            const redflagTypes = [];
            if (item.bb_tidak_adekuat?.toLowerCase() === 'ya') redflagTypes.push('BB tidak adekuat');
            if (item.murmur_edema?.toLowerCase() === 'ya') redflagTypes.push('Murmur/edema');
            if (item.delayed_development?.toLowerCase() === 'ya') redflagTypes.push('Delayed dev');

            notifications.push({
                id: `redflag-${item.id}`,
                type: 'redflag',
                title: '🚩 Redflag Terdeteksi',
                message: `${item.kohort?.balita?.nama_balita || 'Balita'}: ${redflagTypes.slice(0, 2).join(', ')}${redflagTypes.length > 2 ? '...' : ''}`,
                priority: 'high',
                link: `/monitoring/${item.kohort?.balita_id}/antropometri/new`,
                timestamp: item.tanggal
            });
        });
    } catch (e) { console.error('[notifications] redflag error:', e); }

    // Sort by priority (high first) then by timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
        notifications: notifications.slice(0, 15), // Max 15 notifications
        count: notifications.length
    });
}
