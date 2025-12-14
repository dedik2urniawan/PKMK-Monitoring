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
    const desaKel = searchParams.get('desa_kel');
    const nik = searchParams.get('nik');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    // Build end date for filtering
    let endDate: Date | null = null;
    if (tahun && bulan) {
        const year = parseInt(tahun);
        const month = parseInt(bulan);
        endDate = new Date(year, month, 0, 23, 59, 59);
    } else if (tahun) {
        const year = parseInt(tahun);
        endDate = new Date(year, 12, 31, 23, 59, 59);
    }

    try {
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
          monitoring_pkmk_konsumsi(
            minggu_ke,
            tanggal,
            kepatuhan_pct,
            catatan
          )
        )
      `);

        // Role-based filtering
        if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
            query = query.eq('puskesmas_id', user.puskesmas_id);
        } else if (puskesmasId) {
            query = query.eq('puskesmas_id', puskesmasId);
        }

        if (desaKel) query = query.eq('desa_kel', desaKel);
        if (nik) query = query.ilike('nik', `%${nik}%`);

        const { data, error } = await query;

        if (error) {
            console.error('[API /riwayat/konsumsi] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const items = (data || []).map((balita: any) => {
            // FIXED: Get kohort with most monitoring data
            const kohortsWithData = (balita.kohort || [])
                .map((k: any) => ({
                    ...k,
                    dataCount: (k.monitoring_pkmk_konsumsi || []).length
                }))
                .filter((k: any) => k.dataCount > 0)
                .sort((a: any, b: any) => b.dataCount - a.dataCount);

            if (kohortsWithData.length === 0) return null;

            const kohort = kohortsWithData[0];
            let konsumsiRecords = kohort?.monitoring_pkmk_konsumsi || [];

            // Filter by end date if specified
            if (endDate) {
                konsumsiRecords = konsumsiRecords.filter((k: any) => {
                    const tanggalKonsumsi = new Date(k.tanggal); // Changed from k.tanggal_konsumsi to k.tanggal
                    return tanggalKonsumsi <= endDate;
                });

                // Skip balita if no records within date range
                if (konsumsiRecords.length === 0) {
                    return null;
                }
            }

            konsumsiRecords.sort((a: any, b: any) => a.minggu_ke - b.minggu_ke);

            const weeks: any = {};
            konsumsiRecords.forEach((m: any) => { // Changed from measurements.forEach to konsumsiRecords.forEach
                weeks[m.minggu_ke] = {
                    kepatuhan_persen: m.kepatuhan_pct || 0,
                    status_kesehatan: m.catatan && m.catatan.toLowerCase().includes('sakit') ? 'sakit' : 'sehat',
                    tanggal_konsumsi: m.tanggal
                };
            });

            // Determine intervention status
            const maxWeek = konsumsiRecords.length > 0 ? Math.max(...konsumsiRecords.map((m: any) => m.minggu_ke)) : 0;
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
                tanggal_konsumsi_awal: weeks[0]?.tanggal_konsumsi || weeks[1]?.tanggal_konsumsi || null,
                weeks,
                status_intervensi: statusIntervensi,
                current_week: maxWeek
            };
        });

        const filteredItems = items.filter((item: any) => item !== null);

        return NextResponse.json({ items: filteredItems });
    } catch (err) {
        console.error('[API /riwayat/konsumsi] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
