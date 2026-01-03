import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Note: This endpoint returns public reference data (jenis PKMK list)
// No auth required since this is just a lookup table
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('ref_jenis_pkmk')
            .select('id, nama_merk, kategori_usia, rentang_usia, satuan, is_active')
            .order('kategori_usia')
            .order('nama_merk');

        console.log('[API /ref/jenis-pkmk] Query result:', {
            count: data?.length || 0,
            error: error?.message || null,
            firstItem: data?.[0] || null
        });

        if (error) {
            console.error('[API /ref/jenis-pkmk] Supabase Error:', error);
            return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
        }

        return NextResponse.json({ items: data || [] });
    } catch (err: any) {
        console.error('[API /ref/jenis-pkmk] Catch Error:', err);
        return NextResponse.json({ error: err.message, items: [] }, { status: 500 });
    }
}
