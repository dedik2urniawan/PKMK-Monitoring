import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/appUser';

export async function GET() {
    const supabase = await createClient();
    const user = await getAppUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: Removed is_active filter due to potential column type mismatch (text vs boolean)
    const { data, error } = await supabase
        .from('ref_jenis_pkmk')
        .select('id, nama_merk, kategori_usia, rentang_usia, satuan, is_active')
        .order('kategori_usia')
        .order('nama_merk');

    console.log('[API /ref/jenis-pkmk] Raw query result:', data?.length || 0, 'items');

    if (error) {
        console.error('[API /ref/jenis-pkmk] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API /ref/jenis-pkmk] Returning', data?.length || 0, 'items');
    return NextResponse.json({ items: data || [] });
}
