import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json().catch(() => ({} as any));
  const access_token = body?.access_token;
  const refresh_token = body?.refresh_token;

  if (!access_token || !refresh_token) {
    console.error('Session sync failed: missing tokens');
    return new Response("access_token dan refresh_token wajib", { status: 400 });
  }

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    console.error('Supabase setSession error:', error.message);
    return new Response(error.message, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
