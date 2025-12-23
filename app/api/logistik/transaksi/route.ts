import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

// GET - List transaksi
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const puskesmasId = searchParams.get('puskesmas_id');
    const jenisPkmkId = searchParams.get('jenis_pkmk_id');
    const tipeTransaksi = searchParams.get('tipe_transaksi');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
        .from('logistik_transaksi')
        .select(`
            id,
            puskesmas_id,
            jenis_pkmk_id,
            tipe_transaksi,
            jumlah,
            tanggal,
            no_batch,
            tanggal_kadaluarsa,
            keterangan,
            created_at,
            ref_puskesmas:puskesmas_id (id, nama),
            ref_jenis_pkmk:jenis_pkmk_id (id, nama_merk, kategori_usia)
        `)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    // Role-based filtering
    if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
        query = query.eq('puskesmas_id', user.puskesmas_id);
    } else if (puskesmasId) {
        query = query.eq('puskesmas_id', puskesmasId);
    }

    if (jenisPkmkId) {
        query = query.eq('jenis_pkmk_id', jenisPkmkId);
    }

    if (tipeTransaksi) {
        query = query.eq('tipe_transaksi', tipeTransaksi);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[API /logistik/transaksi GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const items = (data || []).map((item: any) => ({
        id: item.id,
        puskesmas_id: item.puskesmas_id,
        puskesmas_nama: item.ref_puskesmas?.nama || '-',
        jenis_pkmk_id: item.jenis_pkmk_id,
        merk: item.ref_jenis_pkmk?.nama_merk || '-',
        kategori_usia: item.ref_jenis_pkmk?.kategori_usia || '-',
        tipe_transaksi: item.tipe_transaksi,
        jumlah: item.jumlah,
        tanggal: item.tanggal,
        no_batch: item.no_batch,
        tanggal_kadaluarsa: item.tanggal_kadaluarsa,
        keterangan: item.keterangan,
        created_at: item.created_at
    }));

    return NextResponse.json({ items });
}

// POST - Create new transaction and update stock
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
        puskesmas_id,
        jenis_pkmk_id,
        tipe_transaksi,
        jumlah,
        tanggal,
        no_batch,
        tanggal_kadaluarsa,
        keterangan
    } = body;

    // Validation
    if (!puskesmas_id || !jenis_pkmk_id || !tipe_transaksi || !jumlah || !tanggal) {
        return NextResponse.json({
            error: 'puskesmas_id, jenis_pkmk_id, tipe_transaksi, jumlah, dan tanggal wajib diisi'
        }, { status: 400 });
    }

    // Determine if masuk (positive) or keluar (negative)
    const isMasuk = tipe_transaksi.startsWith('masuk');
    const signedJumlah = isMasuk ? Math.abs(jumlah) : -Math.abs(jumlah);

    // Get auth user ID
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // 1. Insert transaction
    const { error: insertError } = await supabase
        .from('logistik_transaksi')
        .insert({
            puskesmas_id,
            jenis_pkmk_id,
            tipe_transaksi,
            jumlah: signedJumlah,
            tanggal,
            no_batch: no_batch || null,
            tanggal_kadaluarsa: tanggal_kadaluarsa || null,
            keterangan: keterangan || null,
            created_by: authUser?.id || null
        });

    if (insertError) {
        console.error('[API /logistik/transaksi POST] Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. Update stock (upsert)
    // First, get current stock
    const { data: currentStock } = await supabase
        .from('logistik_stok_puskesmas')
        .select('stok_tersedia')
        .eq('puskesmas_id', puskesmas_id)
        .eq('jenis_pkmk_id', jenis_pkmk_id)
        .single();

    const currentStokValue = currentStock?.stok_tersedia || 0;
    const newStokValue = Math.max(0, currentStokValue + signedJumlah);

    const { error: upsertError } = await supabase
        .from('logistik_stok_puskesmas')
        .upsert({
            puskesmas_id,
            jenis_pkmk_id,
            stok_tersedia: newStokValue,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'puskesmas_id,jenis_pkmk_id'
        });

    if (upsertError) {
        console.error('[API /logistik/transaksi POST] Upsert error:', upsertError);
        // Transaction already inserted, log warning but don't fail
        console.warn('Stock update failed but transaction recorded');
    }

    return NextResponse.json({
        success: true,
        message: isMasuk ? 'Stok masuk berhasil dicatat' : 'Stok keluar berhasil dicatat',
        new_stock: newStokValue
    });
}

// DELETE - Delete transaction and reverse stock change
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID transaksi wajib diisi' }, { status: 400 });
    }

    // 1. Get the transaction to be deleted
    const { data: transaksi, error: fetchError } = await supabase
        .from('logistik_transaksi')
        .select('id, puskesmas_id, jenis_pkmk_id, jumlah')
        .eq('id', id)
        .single();

    if (fetchError || !transaksi) {
        return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Check ownership for admin_puskesmas
    if (user.role === 'admin_puskesmas' && transaksi.puskesmas_id !== user.puskesmas_id) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // 2. Reverse the stock change
    const { data: currentStock } = await supabase
        .from('logistik_stok_puskesmas')
        .select('stok_tersedia')
        .eq('puskesmas_id', transaksi.puskesmas_id)
        .eq('jenis_pkmk_id', transaksi.jenis_pkmk_id)
        .single();

    const currentStokValue = currentStock?.stok_tersedia || 0;
    // Reverse: if original was +60 (masuk), we subtract 60; if was -40 (keluar), we add 40
    const reversedStokValue = Math.max(0, currentStokValue - transaksi.jumlah);

    // Update stock
    const { error: updateError } = await supabase
        .from('logistik_stok_puskesmas')
        .update({
            stok_tersedia: reversedStokValue,
            updated_at: new Date().toISOString()
        })
        .eq('puskesmas_id', transaksi.puskesmas_id)
        .eq('jenis_pkmk_id', transaksi.jenis_pkmk_id);

    if (updateError) {
        console.error('[API /logistik/transaksi DELETE] Stock update error:', updateError);
        // Continue to delete transaction anyway
    }

    // 3. Delete the transaction
    const { error: deleteError } = await supabase
        .from('logistik_transaksi')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('[API /logistik/transaksi DELETE] Delete error:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`[API /logistik/transaksi DELETE] Deleted transaksi ${id}, reversed stock from ${currentStokValue} to ${reversedStokValue}`);

    return NextResponse.json({
        success: true,
        message: 'Transaksi berhasil dihapus dan stok telah disesuaikan',
        new_stock: reversedStokValue
    });
}
