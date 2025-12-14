import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const puskesmasId = searchParams.get('puskesmas_id');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    if (!tahun || !bulan) {
        return NextResponse.json({ error: 'Tahun dan Bulan harus diisi' }, { status: 400 });
    }

    // Build end date for filtering
    const year = parseInt(tahun);
    const month = parseInt(bulan);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    try {
        console.log('[REKAP] Starting query for tahun:', tahun, 'bulan:', bulan, 'puskesmas_id:', puskesmasId);

        // Get puskesmas list to iterate
        let puskesmasQuery = supabase.from('ref_puskesmas').select('id, nama');

        if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
            puskesmasQuery = puskesmasQuery.eq('id', user.puskesmas_id);
        } else if (puskesmasId) {
            puskesmasQuery = puskesmasQuery.eq('id', puskesmasId);
        }

        const { data: puskesmasList, error: pkmError } = await puskesmasQuery;

        if (pkmError) {
            console.error('[REKAP] Error fetching puskesmas:', pkmError);
            return NextResponse.json({ error: pkmError.message }, { status: 500 });
        }

        console.log('[REKAP] Found puskesmas count:', puskesmasList?.length || 0);

        const results = await Promise.all((puskesmasList || []).map(async (pkm) => {
            console.log('[REKAP] Processing puskesmas:', pkm.nama);

            // 1. JUMLAH SASARAN BALITA = Total balita di puskesmas
            const { count: totalBalita, error: countError } = await supabase
                .from('balita')
                .select('id', { count: 'exact', head: true })
                .eq('puskesmas_id', pkm.id);

            if (countError) {
                console.error('[REKAP] Error counting balita:', countError);
            }

            console.log('[REKAP] Total balita for', pkm.nama, ':', totalBalita);

            // Get all balita with kohort and monitoring data
            const { data: balitaData, error: balitaError } = await supabase
                .from('balita')
                .select(`
                    id,
                    kohort (
                        id,
                        periode_mulai,
                        monitoring_antropometri (
                            minggu_ke,
                            tanggal,
                            zs_bbtb,
                            zs_tbu,
                            zs_bbu
                        )
                    )
                `)
                .eq('puskesmas_id', pkm.id);

            if (balitaError) {
                console.error('[REKAP] Error fetching balita data:', balitaError);
                throw balitaError;
            }

            console.log('[REKAP] Balita with kohort:', balitaData?.length || 0);

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

            // Track balita yang sudah diproses untuk avoid double counting
            const processedBalita = new Set<string>();

            (balitaData || []).forEach((balita: any) => {
                const kohorts = balita.kohort || [];

                if (kohorts.length === 0) return; // Skip balita tanpa kohort

                // Cari kohort dengan most recent data
                const kohortWithMostData = kohorts
                    .map((k: any) => ({
                        ...k,
                        dataCount: (k.monitoring_antropometri || []).length
                    }))
                    .filter((k: any) => k.dataCount > 0)
                    .sort((a: any, b: any) => b.dataCount - a.dataCount)[0];

                if (!kohortWithMostData) return; // Skip jika tidak ada monitoring

                const monitoring = kohortWithMostData.monitoring_antropometri || [];

                // Filter monitoring by date <= endDate
                const monitoringInPeriod = monitoring.filter((m: any) => {
                    return new Date(m.tanggal) <= endDate;
                });

                // Get monitoring in the specific month
                const monitoringInMonth = monitoring.filter((m: any) => {
                    const tanggal = new Date(m.tanggal);
                    return tanggal.getFullYear() === year &&
                        tanggal.getMonth() + 1 === month;
                });

                // Check if kohort started before end of month
                const kohortStarted = new Date(kohortWithMostData.periode_mulai) <= endDate;

                if (kohortStarted) {
                    // Check max week reached in period
                    const maxWeekInPeriod = monitoringInPeriod.length > 0
                        ? Math.max(...monitoringInPeriod.map((m: any) => m.minggu_ke))
                        : 0;

                    // 2. DIBERI PKMK BULAN INI = Ada monitoring di bulan filter
                    if (monitoringInMonth.length > 0) {
                        diberiPkmkBulanIni++;

                        // 3. BELUM SELESAI = Week < 12 di bulan filter
                        const maxWeekInMonth = Math.max(...monitoringInMonth.map((m: any) => m.minggu_ke));
                        if (maxWeekInMonth < 12) {
                            belumSelesai++;
                        }

                        // STATUS GIZI = dari monitoring terakhir di bulan ini
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
                    }
                    // 4. DROPOUT = Kohort aktif TAPI tidak monitoring di bulan filter
                    else if (maxWeekInPeriod > 0 && maxWeekInPeriod < 12) {
                        dropout++;
                    }

                    // 5. SELESAI SAMPAI BULAN INI = Kumulatif Week >= 12
                    if (maxWeekInPeriod >= 12) {
                        selesaiSampaiBulanIni++;
                    }
                }
            });

            console.log(`[REKAP] ${pkm.nama}:`, {
                sasaran: totalBalita,
                diberi: diberiPkmkBulanIni,
                belumSelesai,
                dropout,
                selesai: selesaiSampaiBulanIni
            });

            return {
                puskesmas: pkm.nama,
                jumlah_sasaran: totalBalita || 0,
                diberi_pkmk_bulan_ini: diberiPkmkBulanIni,
                belum_selesai: belumSelesai,
                dropout: dropout,
                selesai_sampai_bulan_ini: selesaiSampaiBulanIni,
                status_gizi: statusGiziCounts
            };
        }));

        return NextResponse.json({ items: results });
    } catch (err) {
        console.error('[API /rekap-laporan] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
