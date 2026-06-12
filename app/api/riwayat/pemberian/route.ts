import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/lib/supabase/server';
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
          monitoring_pkmk_pemberian(
            minggu_ke,
            tanggal,
            jumlah_unit
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
            console.error('[API /riwayat/pemberian] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const items = (data || []).map((balita: any) => {
            // FIXED: Get kohort with most monitoring data
            const kohortsWithData = (balita.kohort || [])
                .map((k: any) => ({
                    ...k,
                    dataCount: (k.monitoring_pkmk_pemberian || []).length
                }))
                .filter((k: any) => k.dataCount > 0)
                .sort((a: any, b: any) => b.dataCount - a.dataCount);

            if (kohortsWithData.length === 0) {
                return null;
            }

            const kohort = kohortsWithData[0];
            let pemberianRecords = kohort?.monitoring_pkmk_pemberian || [];

            // Filter by end date if specified
            if (endDate) {
                pemberianRecords = pemberianRecords.filter((p: any) => {
                    const tanggalPemberian = new Date(p.tanggal);
                    return tanggalPemberian <= endDate;
                });

                // Skip balita if no records within date range
                if (pemberianRecords.length === 0) {
                    return null;
                }
            }

            pemberianRecords.sort((a: any, b: any) => a.minggu_ke - b.minggu_ke);

            const weeks: any = {};
            pemberianRecords.forEach((m: any) => {
                weeks[m.minggu_ke] = {
                    jumlah_dosis_ml: m.jumlah_unit,
                    tanggal_pemberian: m.tanggal
                };
            });

            const maxWeek = pemberianRecords.length > 0 ? Math.max(...pemberianRecords.map((m: any) => m.minggu_ke)) : 0;
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
                tanggal_pemberian_awal: weeks[0]?.tanggal_pemberian || weeks[1]?.tanggal_pemberian || null,
                weeks,
                status_intervensi: statusIntervensi,
                current_week: maxWeek
            };
        });

        const filteredItems = items.filter((item: any) => item !== null);

        return NextResponse.json({ items: filteredItems });
    } catch (err) {
        console.error('[API /riwayat/pemberian] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
