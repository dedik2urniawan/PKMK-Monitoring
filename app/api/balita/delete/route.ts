import { NextRequest, NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check menggunakan getAppUser (support JWT decode)
  const appUser = await getAppUser();
  if (!appUser) {
    console.error('[POST /api/balita/delete] No appUser, unauthorized');
    return new Response("Unauthorized", { status: 401 });
  }

  console.log('[POST /api/balita/delete] User:', {
    id: appUser.id,
    role: appUser.role,
    puskesmas_id: appUser.puskesmas_id
  });

  let id: string | undefined;
  let nik: string | undefined;
  try {
    const body = await req.json();
    id = body?.id ?? undefined;
    nik = body?.nik ?? undefined;
  } catch { }

  const isUuid = (v: string | undefined) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  let error: any = null;

  // Construct delete query with role-based filtering
  if (isUuid(id)) {
    let q = supabase.from('balita').delete().eq('id', id as string);
    // Admin puskesmas can only delete their own balita
    if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      q = q.eq('puskesmas_id', appUser.puskesmas_id);
    }
    const r = await q;
    error = r.error;
  } else if (nik) {
    let q = supabase.from('balita').delete().eq('nik', nik);
    // Admin puskesmas can only delete their own balita
    if (appUser.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      q = q.eq('puskesmas_id', appUser.puskesmas_id);
    }
    const r = await q;
    error = r.error;
  } else {
    return new Response('id atau nik wajib diisi', { status: 400 });
  }

  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

