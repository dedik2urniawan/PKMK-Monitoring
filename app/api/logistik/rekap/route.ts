import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

// GET - Rekap logistik report
export async function GET(request: NextRequest) {
    const supabase = createAdminClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const puskesmasId = searchParams.get('puskesmas_id');
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    // Build date range for filtering transactions
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (tahun && bulan) {
        const year = parseInt(tahun);
        const month = parseInt(bulan);
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    } else if (tahun) {
        startDate = `${tahun}-01-01`;
        endDate = `${tahun}-12-31`;
    }

    // Get puskesmas list
    let puskesmasQuery = supabase.from('ref_puskesmas').select('id, nama');

    if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
        puskesmasQuery = puskesmasQuery.eq('id', user.puskesmas_id);
    } else if (puskesmasId) {
        puskesmasQuery = puskesmasQuery.eq('id', puskesmasId);
    }

    const { data: puskesmasList } = await puskesmasQuery;

    // Get jenis PKMK list
    const { data: jenisPkmkList } = await supabase
        .from('ref_jenis_pkmk')
        .select('id, nama_merk, kategori_usia')
        .eq('is_active', true);

    // Get current stock for all puskesmas
    let stokQuery = supabase.from('logistik_stok_puskesmas').select('*');
    if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
        stokQuery = stokQuery.eq('puskesmas_id', user.puskesmas_id);
    } else if (puskesmasId) {
        stokQuery = stokQuery.eq('puskesmas_id', puskesmasId);
    }
    const { data: stokData } = await stokQuery;

    // Get transactions for period
    let transaksiQuery = supabase
        .from('logistik_transaksi')
        .select('puskesmas_id, jenis_pkmk_id, tipe_transaksi, jumlah');

    if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
        transaksiQuery = transaksiQuery.eq('puskesmas_id', user.puskesmas_id);
    } else if (puskesmasId) {
        transaksiQuery = transaksiQuery.eq('puskesmas_id', puskesmasId);
    }

    if (startDate && endDate) {
        transaksiQuery = transaksiQuery.gte('tanggal', startDate).lte('tanggal', endDate);
    }

    const { data: transaksiData } = await transaksiQuery;

    // Build rekap per puskesmas per jenis PKMK
    const rekapItems: any[] = [];

    (puskesmasList || []).forEach((pkm: any) => {
        (jenisPkmkList || []).forEach((jenis: any) => {
            // Current stock
            const stok = (stokData || []).find(
                (s: any) => s.puskesmas_id === pkm.id && s.jenis_pkmk_id === jenis.id
            );

            // Transactions in period
            const transaksi = (transaksiData || []).filter(
                (t: any) => t.puskesmas_id === pkm.id && t.jenis_pkmk_id === jenis.id
            );

            const masuk = transaksi
                .filter((t: any) => t.jumlah > 0)
                .reduce((sum: number, t: any) => sum + t.jumlah, 0);

            const keluar = transaksi
                .filter((t: any) => t.jumlah < 0)
                .reduce((sum: number, t: any) => sum + Math.abs(t.jumlah), 0);

            // Only include if there's stock or transactions
            if (stok || masuk > 0 || keluar > 0) {
                rekapItems.push({
                    puskesmas_id: pkm.id,
                    puskesmas_nama: pkm.nama,
                    jenis_pkmk_id: jenis.id,
                    merk: jenis.nama_merk,
                    kategori_usia: jenis.kategori_usia,
                    stok_saat_ini: stok?.stok_tersedia || 0,
                    stok_minimum: stok?.stok_minimum || 10,
                    masuk_periode: masuk,
                    keluar_periode: keluar,
                    status: (stok?.stok_tersedia || 0) <= 0 ? 'habis'
                        : (stok?.stok_tersedia || 0) <= (stok?.stok_minimum || 10) ? 'menipis'
                            : 'aman'
                });
            }
        });
    });

    // Summary totals
    const summary = {
        total_stok: rekapItems.reduce((sum, r) => sum + r.stok_saat_ini, 0),
        total_masuk: rekapItems.reduce((sum, r) => sum + r.masuk_periode, 0),
        total_keluar: rekapItems.reduce((sum, r) => sum + r.keluar_periode, 0),
        count_habis: rekapItems.filter(r => r.status === 'habis').length,
        count_menipis: rekapItems.filter(r => r.status === 'menipis').length,
        count_aman: rekapItems.filter(r => r.status === 'aman').length
    };

    return NextResponse.json({
        items: rekapItems,
        summary,
        periode: startDate && endDate ? { start: startDate, end: endDate } : null
    });
}
