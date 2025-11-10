import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { access_token, refresh_token } = await req.json().catch(() => ({ access_token: null, refresh_token: null }));
  if (!access_token || !refresh_token) return new Response("token kurang", { status: 400 });
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

