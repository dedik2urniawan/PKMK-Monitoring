import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

// Helper function to calculate rekap for a set of balita
async function calculateRekap(balitaData: any[], year: number, month: number) {
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let diberiPkmkBulanIni = 0;
    let belumSelesai = 0;
    let dropout = 0;
    let selesaiSampaiBulanIni = 0;

    const statusGiziCounts = {
        gizi_buruk: 0,
        gizi_kurang: 0,
        stunted: 0,
        severe_stunted: 0,
        underweight: 0,
        severe_underweight: 0
    };

    (balitaData || []).forEach((balita: any) => {
        const kohorts = balita.kohort || [];
        if (kohorts.length === 0) return;

        const kohortWithMostData = kohorts
            .map((k: any) => ({ ...k, dataCount: (k.monitoring_antropometri || []).length }))
            .filter((k: any) => k.dataCount > 0)
            .sort((a: any, b: any) => b.dataCount - a.dataCount)[0];

        if (!kohortWithMostData) return;

        const monitoring = kohortWithMostData.monitoring_antropometri || [];
        const monitoringInPeriod = monitoring.filter((m: any) => new Date(m.tanggal) <= endDate);
        const monitoringInMonth = monitoring.filter((m: any) => {
            const tanggal = new Date(m.tanggal);
            return tanggal.getFullYear() === year && tanggal.getMonth() + 1 === month;
        });

        const kohortStarted = new Date(kohortWithMostData.periode_mulai) <= endDate;

        if (kohortStarted) {
            const maxWeekInPeriod = monitoringInPeriod.length > 0
                ? Math.max(...monitoringInPeriod.map((m: any) => m.minggu_ke))
                : 0;

            if (monitoringInMonth.length > 0) {
                diberiPkmkBulanIni++;
                const maxWeekInMonth = Math.max(...monitoringInMonth.map((m: any) => m.minggu_ke));
                if (maxWeekInMonth < 12) belumSelesai++;

                const latestMonitoring = monitoringInMonth.sort((a: any, b: any) => b.minggu_ke - a.minggu_ke)[0];
                const zsBbtb = latestMonitoring.zs_bbtb || 0;
                const zsTbu = latestMonitoring.zs_tbu || 0;
                const zsBbu = latestMonitoring.zs_bbu || 0;

                if (zsBbtb < -3) statusGiziCounts.gizi_buruk++;
                else if (zsBbtb < -2) statusGiziCounts.gizi_kurang++;
                if (zsTbu < -3) statusGiziCounts.severe_stunted++;
                else if (zsTbu < -2) statusGiziCounts.stunted++;
                if (zsBbu < -3) statusGiziCounts.severe_underweight++;
                else if (zsBbu < -2) statusGiziCounts.underweight++;
            } else if (maxWeekInPeriod > 0 && maxWeekInPeriod < 12) {
                dropout++;
            }

            if (maxWeekInPeriod >= 12) selesaiSampaiBulanIni++;
        }
    });

    return {
        jumlah_sasaran: balitaData.length,
        diberi_pkmk_bulan_ini: diberiPkmkBulanIni,
        belum_selesai: belumSelesai,
        dropout,
        selesai_sampai_bulan_ini: selesaiSampaiBulanIni,
        status_gizi: statusGiziCounts
    };
}

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const puskesmasId = searchParams.get('puskesmas_id');
    const desaKel = searchParams.get('desa_kel');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    if (!tahun || !bulan) {
        return NextResponse.json({ error: 'Tahun dan Bulan harus diisi' }, { status: 400 });
    }

    const year = parseInt(tahun);
    const month = parseInt(bulan);

    try {
        console.log('[REKAP] Query params:', { tahun, bulan, puskesmasId, desaKel, role: user.role });

        // Determine grouping mode:
        // - superadmin + no puskesmas = group by puskesmas
        // - superadmin + puskesmas + no desa = group by desa
        // - superadmin + puskesmas + desa = specific desa only
        // - admin_puskesmas + no desa = group by desa
        // - admin_puskesmas + desa = specific desa only

        const effectivePuskesmasId = user.role === 'admin_puskesmas' ? user.puskesmas_id : puskesmasId;
        const shouldGroupByDesa = (user.role === 'admin_puskesmas' && !desaKel) ||
            (user.role === 'superadmin' && puskesmasId && !desaKel);
        const isSpecificDesa = !!desaKel;
        const isAllPuskesmas = user.role === 'superadmin' && !puskesmasId;

        console.log('[REKAP] Mode:', { shouldGroupByDesa, isSpecificDesa, isAllPuskesmas, effectivePuskesmasId });

        let results: any[] = [];

        if (isAllPuskesmas) {
            // GROUP BY PUSKESMAS (superadmin, all puskesmas selected)
            const { data: puskesmasList } = await supabase
                .from('ref_puskesmas')
                .select('id, nama')
                .not('nama', 'ilike', '%dinkes%');

            results = await Promise.all((puskesmasList || []).map(async (pkm) => {
                const { data: balitaData } = await supabase
                    .from('balita')
                    .select(`id, desa_kel, kohort (id, periode_mulai, monitoring_antropometri (minggu_ke, tanggal, zs_bbtb, zs_tbu, zs_bbu))`)
                    .eq('puskesmas_id', pkm.id);

                const rekap = await calculateRekap(balitaData || [], year, month);
                return { puskesmas: pkm.nama, ...rekap };
            }));

        } else if (shouldGroupByDesa) {
            // GROUP BY DESA (puskesmas selected, all desa OR admin_puskesmas default)
            const { data: desaList } = await supabase
                .from('ref_desa')
                .select('id, desa_kel, puskesmas_id')
                .eq('puskesmas_id', effectivePuskesmasId);

            // Get puskesmas name for label
            const { data: pkmData } = await supabase
                .from('ref_puskesmas')
                .select('nama')
                .eq('id', effectivePuskesmasId)
                .single();

            const pkmName = pkmData?.nama || '';

            results = await Promise.all((desaList || []).map(async (desa) => {
                const { data: balitaData } = await supabase
                    .from('balita')
                    .select(`id, desa_kel, kohort (id, periode_mulai, monitoring_antropometri (minggu_ke, tanggal, zs_bbtb, zs_tbu, zs_bbu))`)
                    .eq('puskesmas_id', effectivePuskesmasId)
                    .ilike('desa_kel', desa.desa_kel);

                const rekap = await calculateRekap(balitaData || [], year, month);
                return {
                    puskesmas: user.role === 'admin_puskesmas' ? desa.desa_kel : `${pkmName} - ${desa.desa_kel}`,
                    ...rekap
                };
            }));

        } else if (isSpecificDesa) {
            // SPECIFIC DESA (specific desa selected)
            const { data: pkmData } = await supabase
                .from('ref_puskesmas')
                .select('nama')
                .eq('id', effectivePuskesmasId)
                .single();

            const pkmName = pkmData?.nama || '';

            const { data: balitaData } = await supabase
                .from('balita')
                .select(`id, desa_kel, kohort (id, periode_mulai, monitoring_antropometri (minggu_ke, tanggal, zs_bbtb, zs_tbu, zs_bbu))`)
                .eq('puskesmas_id', effectivePuskesmasId)
                .ilike('desa_kel', desaKel);

            const rekap = await calculateRekap(balitaData || [], year, month);
            results = [{
                puskesmas: user.role === 'admin_puskesmas' ? desaKel : `${pkmName} - ${desaKel}`,
                ...rekap
            }];
        }

        // Filter out empty results (no balita)
        results = results.filter(r => r.jumlah_sasaran > 0);

        console.log('[REKAP] Results count:', results.length);
        return NextResponse.json({ items: results });

    } catch (err) {
        console.error('[API /rekap-laporan] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
