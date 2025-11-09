import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let id: string | undefined;
  let nik: string | undefined;
  try {
    const body = await req.json();
    id = body?.id ?? undefined;
    nik = body?.nik ?? undefined;
  } catch {}

  const isUuid = (v: string | undefined) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  let error: any = null;
  if (isUuid(id)) {
    const r = await supabase.from('balita').delete().eq('id', id as string);
    error = r.error;
  } else if (nik) {
    const r = await supabase.from('balita').delete().eq('nik', nik);
    error = r.error;
  } else {
    return new Response('id atau nik wajib diisi', { status: 400 });
  }

  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

