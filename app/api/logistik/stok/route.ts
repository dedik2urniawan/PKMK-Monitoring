import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

// GET - List stok per puskesmas
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const puskesmasId = searchParams.get('puskesmas_id');

    let query = supabase
        .from('logistik_stok_puskesmas')
        .select(`
            id,
            puskesmas_id,
            jenis_pkmk_id,
            stok_tersedia,
            stok_minimum,
            updated_at,
            ref_puskesmas:puskesmas_id (id, nama),
            ref_jenis_pkmk:jenis_pkmk_id (id, nama_merk, kategori_usia, rentang_usia, satuan)
        `)
        .order('updated_at', { ascending: false });

    // Role-based filtering
    if (user.role === 'admin_puskesmas' && user.puskesmas_id) {
        query = query.eq('puskesmas_id', user.puskesmas_id);
    } else if (puskesmasId) {
        query = query.eq('puskesmas_id', puskesmasId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[API /logistik/stok] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data for easier frontend consumption
    const items = (data || []).map((item: any) => ({
        id: item.id,
        puskesmas_id: item.puskesmas_id,
        puskesmas_nama: item.ref_puskesmas?.nama || '-',
        jenis_pkmk_id: item.jenis_pkmk_id,
        merk: item.ref_jenis_pkmk?.nama_merk || '-',
        kategori_usia: item.ref_jenis_pkmk?.kategori_usia || '-',
        rentang_usia: item.ref_jenis_pkmk?.rentang_usia || '-',
        satuan: item.ref_jenis_pkmk?.satuan || 'sachet',
        stok_tersedia: item.stok_tersedia,
        stok_minimum: item.stok_minimum,
        status: item.stok_tersedia <= 0 ? 'habis' : item.stok_tersedia <= item.stok_minimum ? 'menipis' : 'aman',
        updated_at: item.updated_at
    }));

    return NextResponse.json({ items });
}

// POST - Initialize or update stok record
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { puskesmas_id, jenis_pkmk_id, stok_tersedia, stok_minimum } = body;

    if (!puskesmas_id || !jenis_pkmk_id) {
        return NextResponse.json({ error: 'puskesmas_id dan jenis_pkmk_id wajib diisi' }, { status: 400 });
    }

    // Upsert - insert or update if exists
    const { data, error } = await supabase
        .from('logistik_stok_puskesmas')
        .upsert({
            puskesmas_id,
            jenis_pkmk_id,
            stok_tersedia: stok_tersedia ?? 0,
            stok_minimum: stok_minimum ?? 10,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'puskesmas_id,jenis_pkmk_id'
        })
        .select();

    if (error) {
        console.error('[API /logistik/stok POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
}

// DELETE - Remove stok record and its related transactions
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
    }

    // 1. Get the stok record to find puskesmas_id and jenis_pkmk_id
    const { data: existing, error: fetchError } = await supabase
        .from('logistik_stok_puskesmas')
        .select('id, puskesmas_id, jenis_pkmk_id')
        .eq('id', id)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json({ error: 'Stok tidak ditemukan' }, { status: 404 });
    }

    // Check ownership for admin_puskesmas
    if (user.role === 'admin_puskesmas' && existing.puskesmas_id !== user.puskesmas_id) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // 2. Delete all related transactions first
    const { error: txDeleteError, count: deletedTxCount } = await supabase
        .from('logistik_transaksi')
        .delete()
        .eq('puskesmas_id', existing.puskesmas_id)
        .eq('jenis_pkmk_id', existing.jenis_pkmk_id);

    if (txDeleteError) {
        console.error('[API /logistik/stok DELETE] Transaction delete error:', txDeleteError);
        // Continue anyway to delete stok
    } else {
        console.log(`[API /logistik/stok DELETE] Deleted related transactions for stok ${id}`);
    }

    // 3. Delete the stok record
    const { error } = await supabase
        .from('logistik_stok_puskesmas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[API /logistik/stok DELETE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: 'Stok dan riwayat transaksi terkait berhasil dihapus'
    });
}
