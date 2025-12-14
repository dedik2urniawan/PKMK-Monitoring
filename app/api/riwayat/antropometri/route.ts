import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const puskesmasId = searchParams.get('puskesmas_id');
    const desaKel = searchParams.get('desa_kel');
    const nik = searchParams.get('nik');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    // Build end date for filtering: last day of selected month/year
    let endDate: Date | null = null;
    if (tahun && bulan) {
        const year = parseInt(tahun);
        const month = parseInt(bulan);
        // Create date for last day of selected month
        endDate = new Date(year, month, 0, 23, 59, 59);
    } else if (tahun) {
        // If only year selected, use December 31 of that year
        const year = parseInt(tahun);
        endDate = new Date(year, 12, 31, 23, 59, 59);
    }

    try {
        // Base query: Get all balita with their kohort and antropometri measurements
        let query = supabase
            .from('balita')
            .select(`
        id,
        nama_balita,
        nik,
        jk,
        tgl_lahir,
        kec,
        desa_kel,
        puskesmas:puskesmas_id(nama),
        kohort(
          id,
          periode_mulai,
          monitoring_antropometri(
            minggu_ke,
            tanggal,
            bb_kg,
            tb_cm,
            zs_bbu,
            zs_tbu,
            zs_bbtb
          )
        )
      `);

        // Apply role-based filtering
        if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
            query = query.eq('puskesmas_id', user.puskesmas_id);
        } else if (puskesmasId) {
            query = query.eq('puskesmas_id', puskesmasId);
        }

        // Apply additional filters
        if (desaKel) {
            query = query.eq('desa_kel', desaKel);
        }
        if (nik) {
            query = query.ilike('nik', `%${nik}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[API /riwayat/antropometri] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform data to flatten and organize by weeks
        const items = (data || []).map((balita: any) => {
            // FIXED: Get kohort with most monitoring data (not just latest)
            // This handles cases where balita has multiple kohorts
            const kohortsWithData = (balita.kohort || [])
                .map((k: any) => ({
                    ...k,
                    dataCount: (k.monitoring_antropometri || []).length
                }))
                .filter((k: any) => k.dataCount > 0)
                .sort((a: any, b: any) => b.dataCount - a.dataCount);

            if (kohortsWithData.length === 0) {
                return null; // No kohort with data
            }

            const kohort = kohortsWithData[0]; // Kohort with most data
            let measurements = kohort?.monitoring_antropometri || [];

            // Filter measurements by end date if specified
            if (endDate) {
                measurements = measurements.filter((m: any) => {
                    const tanggalMonitoring = new Date(m.tanggal);
                    return tanggalMonitoring <= endDate;
                });

                // Skip balita if no measurements within date range
                if (measurements.length === 0) {
                    return null;
                }
            }

            // Sort by minggu_ke
            measurements.sort((a: any, b: any) => a.minggu_ke - b.minggu_ke);

            // Create weeks object (week 1-12)
            const weeks: any = {};
            measurements.forEach((m: any) => {
                weeks[m.minggu_ke] = {
                    bb: m.bb_kg,
                    tb: m.tb_cm,
                    zs_bbu: m.zs_bbu,
                    zs_tbu: m.zs_tbu,
                    zs_bbtb: m.zs_bbtb,
                    tanggal_pengukuran: m.tanggal
                };
            });

            // Calculate deltas (current week - previous week)
            for (let week = 2; week <= 12; week++) {
                if (weeks[week] && weeks[week - 1]) {
                    weeks[week].delta_bb = weeks[week].bb - weeks[week - 1].bb;
                    weeks[week].delta_tb = weeks[week].tb - weeks[week - 1].tb;
                }
            }

            // Determine intervention status
            const maxWeek = measurements.length > 0 ? Math.max(...measurements.map((m: any) => m.minggu_ke)) : 0;
            const statusIntervensi = maxWeek >= 12 ? "Intervensi Selesai" : "Intervensi Proses Pemantauan";

            return {
                balita_id: balita.id,
                nama_balita: balita.nama_balita,
                nik: balita.nik,
                jk: balita.jk,
                tgl_lahir: balita.tgl_lahir,
                kec: balita.kec,
                puskesmas: balita.puskesmas?.nama || '-',
                desa_kel: balita.desa_kel,
                tanggal_pengukuran_awal: weeks[1]?.tanggal_pengukuran || null,
                weeks,
                status_intervensi: statusIntervensi,
                current_week: maxWeek
            };
        });

        // Filter out null items (balita with no measurements)
        const filteredItems = items.filter((item: any) => item !== null);

        return NextResponse.json({ items: filteredItems });
    } catch (err) {
        console.error('[API /riwayat/antropometri] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
